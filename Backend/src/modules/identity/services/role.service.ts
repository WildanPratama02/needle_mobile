import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { ALL_PERMISSIONS, PermissionCode } from '../../../shared/constants/permissions';
import { ROLE_PERMISSIONS, RoleCode } from '../../../shared/constants/roles';

export interface RoleWithMemberCount {
  code: RoleCode;
  permissionCodes: PermissionCode[];
  memberCount: number;
}

/**
 * Read-only role/permission catalogue (`.scratch/roles-permissions/spec.md`).
 *
 * The catalogue itself (which roles exist, what they grant) is global
 * policy, not factory data — unlike `UserService`, there is no
 * `factoryId`-narrowable list here. `memberCount` is the one field that
 * *is* scoped: it counts only the caller's factory-scope intersection, so a
 * factory-scoped `USER_MANAGE` holder never sees a global headcount for a
 * role they don't fully oversee.
 */
@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(caller: AuthenticatedUser): Promise<RoleWithMemberCount[]> {
    const codes = Object.keys(ROLE_PERMISSIONS) as RoleCode[];

    const counts = await this.prisma.$transaction(
      codes.map((code) =>
        this.prisma.user.count({
          where: {
            roles: { some: { role: { code } } },
            factoryScopes: { some: { factoryId: { in: caller.factoryIds } } },
          },
        }),
      ),
    );

    return codes.map((code, index) => ({
      code,
      permissionCodes: ROLE_PERMISSIONS[code],
      memberCount: counts[index],
    }));
  }

  findAllPermissions(): PermissionCode[] {
    return ALL_PERMISSIONS;
  }
}
