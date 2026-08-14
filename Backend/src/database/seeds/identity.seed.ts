import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

import { ALL_PERMISSIONS } from '../../shared/constants/permissions';
import { ROLES, ROLE_PERMISSIONS, RoleCode } from '../../shared/constants/roles';

const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  SYSTEM_ADMIN: 'Full administrative access to master data, users and devices',
  PIC_TROLI: 'Trolley operator who runs the needle exchange flow',
  PIC_INVENTORY: 'Warehouse operator responsible for stock movements',
  MANAGEMENT: 'Read-only monitoring: dashboard, analytics and reports',
  APPROVER: 'Decides confirmations for broken exchanges with a missing fragment',
};

/** Turns `EXCHANGE_CREATE` into `Exchange create` for the human-facing name. */
export function humanize(code: string): string {
  const words = code.toLowerCase().split('_');
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ');
}

async function seedPermissions(prisma: PrismaClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const code of ALL_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { name: humanize(code) },
      create: { code, name: humanize(code) },
    });
    ids.set(code, permission.id);
  }

  return ids;
}

async function seedRoles(
  prisma: PrismaClient,
  permissionIds: Map<string, string>,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const code of Object.values(ROLES)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: humanize(code), description: ROLE_DESCRIPTIONS[code] },
      create: { code, name: humanize(code), description: ROLE_DESCRIPTIONS[code] },
    });
    ids.set(code, role.id);

    // Re-grant from the map every run, so removing a permission from
    // ROLE_PERMISSIONS actually takes it away instead of leaving a stale grant.
    const wanted = ROLE_PERMISSIONS[code].map((permission) => permissionIds.get(permission)!);

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: { notIn: wanted } },
    });

    for (const permissionId of wanted) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return ids;
}

/**
 * Development bootstrap account. The password comes from SEED_ADMIN_PASSWORD
 * when set; otherwise a known dev default, which is why this seed must never
 * run against production.
 */
async function seedAdminUser(prisma: PrismaClient, roleIds: Map<string, string>): Promise<string> {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      name: 'System Admin',
      email: `${username}@needle.local`,
      passwordHash: await hash(password, 10),
    },
  });

  const roleId = roleIds.get(ROLES.SYSTEM_ADMIN)!;

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId } },
    update: {},
    create: { userId: user.id, roleId },
  });

  console.log(`Seeded admin user "${username}"`);

  return user.id;
}

export interface IdentitySeedResult {
  adminUserId: string;
}

export async function seedIdentity(prisma: PrismaClient): Promise<IdentitySeedResult> {
  const permissionIds = await seedPermissions(prisma);
  console.log(`Seeded ${permissionIds.size} permissions`);

  const roleIds = await seedRoles(prisma, permissionIds);
  console.log(`Seeded ${roleIds.size} roles with their permission grants`);

  const adminUserId = await seedAdminUser(prisma, roleIds);

  return { adminUserId };
}
