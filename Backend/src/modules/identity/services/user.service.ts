import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { UserQueryDto } from '../dto/user-query.dto';

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
 * Read-only user directory (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * Lives beside `AuthService`/`UserRepository` in `identity` rather than a new
 * module — both read the same `User` table `AuthService` already queries for
 * login. Read-only: no create, update, role reassignment or scope
 * reassignment here (see the spec's Out of Scope).
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
}
