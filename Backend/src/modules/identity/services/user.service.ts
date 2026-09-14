import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleStatus, User, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { UserQueryDto } from '../dto/user-query.dto';
import { CreateUserDto, UpdateUserDto } from '../dto/user-request.dto';
import { PASSWORD_HASH_ROUNDS } from './password-reset.service';

const MAX_PAGE_SIZE = 100;

export interface PagedRows<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserWithRolesAndScopes = User & {
  roles: { role: { code: string } }[];
  factoryScopes: { factoryId: string }[];
};

const USER_INCLUDE = {
  roles: { include: { role: true } },
  factoryScopes: true,
} as const;

/** Username ascending, id as a tiebreaker — same paging-safety rule every list in this system follows. */
const BY_USERNAME = [{ username: 'asc' as const }, { id: 'asc' as const }];

/**
 * User directory (`.scratch/users-read-api/spec.md`, GAP-06) and its writes
 * (`.scratch/admin-panel-crud/issues/06`).
 *
 * Lives beside `AuthService`/`UserRepository` in `identity` rather than a new
 * module — both work on the same `User` table `AuthService` already queries
 * for login.
 *
 * **Writes never widen access.** A caller can only grant factories inside
 * their own scope, and only roles whose every permission they already hold —
 * otherwise `USER_MANAGE` alone would be a path to any permission in the
 * system. Location scope and admin-initiated "Reset Access" have no contract
 * yet and are not here.
 *
 * Scoped the same never-widen-intersection way every other scoped list
 * already is (`master-data.service.ts`'s `scopedFactoryIds`,
 * `exchange.service.ts`'s `findMany`) — except a user's scope is a
 * many-to-many (`UserFactoryScope`), not a single `factoryId` column, so
 * "in scope" means "shares at least one factory with the caller" rather
 * than "its own factoryId is in the caller's list".
 */
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private static scopedFactoryIds(caller: AuthenticatedUser, requested?: string): string[] {
    return requested ? caller.factoryIds.filter((id) => id === requested) : caller.factoryIds;
  }

  async findMany(
    query: UserQueryDto,
    caller: AuthenticatedUser,
  ): Promise<PagedRows<UserWithRolesAndScopes>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const scopedFactoryIds = UserService.scopedFactoryIds(caller, query.factoryId);
    // An empty scoped list (a requested factory outside the caller's own
    // scope, or — defensively — a caller with no scope rows at all) must
    // resolve to "no rows", not throw and not fall through to "all users".
    const where = {
      factoryScopes: { some: { factoryId: { in: scopedFactoryIds } } },
      // `role=<code>` (`.scratch/roles-permissions/spec.md`) — role-membership
      // lookup for Roles & Permissions, reusing this endpoint's own scope.
      ...(query.role ? { roles: { some: { role: { code: query.role } } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        orderBy: BY_USERNAME,
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string, caller: AuthenticatedUser): Promise<UserWithRolesAndScopes> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: USER_INCLUDE });
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    // Scope is checked after loading, so a caller cannot use the difference
    // between 404 and 403 to discover which ids exist outside their scope —
    // same rule master-data's by-id reads already apply.
    const sharesScope = user.factoryScopes.some((scope) =>
      caller.factoryIds.includes(scope.factoryId),
    );
    if (!sharesScope) {
      throw new ForbiddenException(`Out of factory scope: ${id}`);
    }

    return user;
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  /** Re-reads a user after a write without a scope check — the write itself was authorized. */
  private async reload(id: string): Promise<UserWithRolesAndScopes> {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, include: USER_INCLUDE });
  }

  async create(dto: CreateUserDto, caller: AuthenticatedUser): Promise<UserWithRolesAndScopes> {
    for (const factoryId of dto.factoryIds) {
      assertFactoryScope(caller, factoryId);
    }
    const existing = await this.prisma.factory.count({ where: { id: { in: dto.factoryIds } } });
    if (existing !== dto.factoryIds.length) {
      throw new NotFoundException('One or more factoryIds do not exist');
    }

    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: {
          username: dto.username,
          name: dto.name,
          passwordHash,
          factoryScopes: { create: dto.factoryIds.map((factoryId) => ({ factoryId })) },
        },
        include: USER_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Username already in use: ${dto.username}`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    caller: AuthenticatedUser,
  ): Promise<UserWithRolesAndScopes> {
    await this.findOne(id, caller);
    // Deactivation takes effect on the very next request (JwtStrategy loads
    // only ACTIVE users) — deactivating yourself would end your own session
    // mid-task with nobody left to undo it.
    if (id === caller.id && dto.status === UserStatus.INACTIVE) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    // Activating or deactivating an account switches all of its access on or
    // off, so it follows the same never-widen rule as a role grant: nobody
    // may lock out — or revive — an account more privileged than themselves.
    if (dto.status !== undefined) {
      await this.assertDoesNotOutrankCaller(id, caller);
    }

    return this.prisma.user.update({
      where: { id },
      data: { name: dto.name, status: dto.status },
      include: USER_INCLUDE,
    });
  }

  /** Refuses when the target holds, through an ACTIVE role, a permission the caller does not. */
  private async assertDoesNotOutrankCaller(id: string, caller: AuthenticatedUser): Promise<void> {
    const held = await this.prisma.permission.findMany({
      where: {
        roles: { some: { role: { status: RoleStatus.ACTIVE, users: { some: { userId: id } } } } },
      },
      select: { code: true },
    });
    const beyondCaller = held
      .map((permission) => permission.code)
      .filter((code) => !caller.permissions.includes(code));
    if (beyondCaller.length > 0) {
      throw new ForbiddenException(
        `User holds permissions you do not hold: ${beyondCaller.join(', ')}`,
      );
    }
  }

  /** Loads a role by code and refuses one that would hand out a permission the caller lacks. */
  private async loadManageableRole(
    roleCode: string,
    caller: AuthenticatedUser,
    options: { requireActive: boolean },
  ) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleCode}`);
    }
    if (options.requireActive && role.status !== RoleStatus.ACTIVE) {
      throw new BadRequestException(`Role is not active: ${roleCode}`);
    }

    const beyondCaller = role.permissions
      .map((link) => link.permission.code)
      .filter((code) => !caller.permissions.includes(code));
    if (beyondCaller.length > 0) {
      throw new ForbiddenException(
        `Role ${roleCode} carries permissions you do not hold: ${beyondCaller.join(', ')}`,
      );
    }
    return role;
  }

  async assignRole(
    id: string,
    roleCode: string,
    caller: AuthenticatedUser,
  ): Promise<UserWithRolesAndScopes> {
    await this.findOne(id, caller);
    const role = await this.loadManageableRole(roleCode, caller, { requireActive: true });

    // Idempotent: assigning a role the user already holds is a no-op.
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId: id, roleId: role.id } },
      create: { userId: id, roleId: role.id },
      update: {},
    });
    return this.reload(id);
  }

  async revokeRole(
    id: string,
    roleCode: string,
    caller: AuthenticatedUser,
  ): Promise<UserWithRolesAndScopes> {
    await this.findOne(id, caller);
    const role = await this.loadManageableRole(roleCode, caller, { requireActive: false });

    const { count } = await this.prisma.userRole.deleteMany({
      where: { userId: id, roleId: role.id },
    });
    if (count === 0) {
      throw new NotFoundException(`User does not hold role ${roleCode}`);
    }
    return this.reload(id);
  }

  async assignFactoryScope(
    id: string,
    factoryId: string,
    caller: AuthenticatedUser,
  ): Promise<UserWithRolesAndScopes> {
    await this.findOne(id, caller);
    assertFactoryScope(caller, factoryId);
    if ((await this.prisma.factory.count({ where: { id: factoryId } })) === 0) {
      throw new NotFoundException(`Factory not found: ${factoryId}`);
    }

    await this.prisma.userFactoryScope.upsert({
      where: { userId_factoryId: { userId: id, factoryId } },
      create: { userId: id, factoryId },
      update: {},
    });
    return this.reload(id);
  }

  async revokeFactoryScope(
    id: string,
    factoryId: string,
    caller: AuthenticatedUser,
  ): Promise<UserWithRolesAndScopes> {
    const user = await this.findOne(id, caller);
    assertFactoryScope(caller, factoryId);

    if (!user.factoryScopes.some((scope) => scope.factoryId === factoryId)) {
      throw new NotFoundException(`User is not scoped to factory ${factoryId}`);
    }
    if (user.factoryScopes.length === 1) {
      throw new BadRequestException('A user must keep at least one factory scope');
    }

    await this.prisma.userFactoryScope.deleteMany({ where: { userId: id, factoryId } });
    return this.reload(id);
  }
}
