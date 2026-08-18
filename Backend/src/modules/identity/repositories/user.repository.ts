import { Injectable } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';

/** What `UserDirectoryService` needs to project a row and check factory-scope overlap. */
export type UserWithRolesAndScopes = User & {
  roles: { role: { code: string } }[];
  factoryScopes: { factoryId: string }[];
};

/** `username` ascending, `id` as a tiebreaker — same paging-safety rule every list now follows (GAP-08). */
const BY_USERNAME = [{ username: 'asc' as const }, { id: 'asc' as const }];

const WITH_ROLES_AND_SCOPES = {
  roles: { include: { role: { select: { code: true } } } },
  factoryScopes: { select: { factoryId: true } },
} satisfies Prisma.UserInclude;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * A user is "in scope" when at least one of their factory-scope rows falls
   * inside the caller's own (already-narrowed) factory ids — the same
   * relation-level filter `master-data.service.ts` uses for its factory-scoped
   * collections, just expressed through a join table instead of a column.
   */
  async findManyInFactoryScope(
    factoryIds: string[],
    status: UserStatus | undefined,
    skip: number,
    take: number,
  ): Promise<{ items: UserWithRolesAndScopes[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      factoryScopes: { some: { factoryId: { in: factoryIds } } },
      status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: WITH_ROLES_AND_SCOPES,
        orderBy: BY_USERNAME,
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  findByIdWithRolesAndScopes(id: string): Promise<UserWithRolesAndScopes | null> {
    return this.prisma.user.findUnique({ where: { id }, include: WITH_ROLES_AND_SCOPES });
  }

  /**
   * Loads the caller's full authorization picture — roles, the permissions
   * those roles carry, and the factory / location scopes.
   *
   * Returns null for an unknown or INACTIVE user, so deactivating an account
   * takes effect on the next request rather than when their token expires.
   */
  async loadAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: UserStatus.ACTIVE },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        factoryScopes: true,
        locationScopes: true,
      },
    });

    if (!user) {
      return null;
    }

    // Only ACTIVE roles contribute permissions — suspending a role has to
    // actually remove access, not just hide it from the UI.
    const activeRoles = user.roles
      .map((link) => link.role)
      .filter((role) => role.status === 'ACTIVE');

    const permissions = new Set<string>();
    for (const role of activeRoles) {
      for (const link of role.permissions) {
        permissions.add(link.permission.code);
      }
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      roles: activeRoles.map((role) => role.code),
      permissions: [...permissions],
      factoryIds: user.factoryScopes.map((scope) => scope.factoryId),
      locationIds: user.locationScopes.map((scope) => scope.locationId),
    };
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
