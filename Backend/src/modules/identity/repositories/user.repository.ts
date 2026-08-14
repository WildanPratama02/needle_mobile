import { Injectable } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
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
