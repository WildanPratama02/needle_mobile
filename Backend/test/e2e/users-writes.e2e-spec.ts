import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';
import { createTestApp } from './create-test-app';

interface Envelope<T> {
  success: boolean;
  data: T;
}

interface UserRow {
  id: string;
  username: string;
  name: string;
  status: string;
  roles: string[];
  factoryIds: string[];
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * `/users` writes (`.scratch/admin-panel-crud/issues/06`). The admin here is
 * factory-scoped to A and C, holds USER_MANAGE + EXCHANGE_VIEW, and so may
 * grant exactly that much and no more.
 */
describe('Users writes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const adminUsername = `e2e_uw_admin_${suffix}`;
  const newUsername = `e2e_uw_new_${suffix}`;
  const adminRoleCode = `E2E_UW_ADMIN_${suffix}`.toUpperCase();
  const narrowRoleCode = `E2E_UW_NARROW_${suffix}`.toUpperCase();
  const wideRoleCode = `E2E_UW_WIDE_${suffix}`.toUpperCase();

  let adminToken: string;
  let adminId: string;
  let factoryA: string;
  let factoryB: string;
  let factoryC: string;
  let newUserId: string;

  const server = () => app.getHttpServer() as Server;
  const as = (token: string) => (req: request.Test) => req.set('Authorization', `Bearer ${token}`);
  const post = (path: string, body: object = {}) =>
    as(adminToken)(request(server()).post(`/api/v1${path}`).send(body));
  const patch = (path: string, body: object) =>
    as(adminToken)(request(server()).patch(`/api/v1${path}`).send(body));
  const del = (path: string) => as(adminToken)(request(server()).delete(`/api/v1${path}`));

  const loginStatus = async (username: string, secret: string) =>
    (await request(server()).post('/api/v1/auth/login').send({ username, password: secret }))
      .status;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const makeFactory = async (tag: string) =>
      (
        await prisma.factory.create({
          data: { code: `FAC-UW-${tag}-${suffix}`, name: `UW ${tag}`, timezone: 'Asia/Jakarta' },
        })
      ).id;
    factoryA = await makeFactory('A');
    factoryB = await makeFactory('B');
    factoryC = await makeFactory('C');

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );
    const roleWith = async (code: string, permissionCodes: string[]) => {
      const permissions = await permissionFor(permissionCodes);
      return prisma.role.create({
        data: {
          code,
          name: code,
          permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
        },
      });
    };

    const adminRole = await roleWith(adminRoleCode, [
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.EXCHANGE_VIEW,
    ]);
    await roleWith(narrowRoleCode, [PERMISSIONS.EXCHANGE_VIEW]);
    await roleWith(wideRoleCode, [PERMISSIONS.STOCK_ADJUST]);

    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        name: 'E2E UW Admin',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: adminRole.id }] },
        factoryScopes: { create: [{ factoryId: factoryA }, { factoryId: factoryC }] },
      },
    });
    adminId = admin.id;

    const response = await request(server())
      .post('/api/v1/auth/login')
      .send({ username: adminUsername, password })
      .expect(200);
    adminToken = envelope<{ accessToken: string }>(response).data.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.auditLog.deleteMany({ where: { actorUserId: adminId } });
      await prisma.user.deleteMany({ where: { username: { in: [adminUsername, newUsername] } } });
      await prisma.role.deleteMany({
        where: { code: { in: [adminRoleCode, narrowRoleCode, wideRoleCode] } },
      });
      await prisma.factory.deleteMany({ where: { id: { in: [factoryA, factoryB, factoryC] } } });
    }
    await app?.close();
  });

  describe('create', () => {
    const body = () => ({
      username: newUsername,
      name: 'New User',
      password: 'Welcome123',
      factoryIds: [factoryA],
    });

    it('refuses a factory outside the admin scope', async () => {
      await post('/users', { ...body(), factoryIds: [factoryB] }).expect(403);
    });

    it('refuses a password without a digit', async () => {
      await post('/users', { ...body(), password: 'NoDigitsHere' }).expect(400);
    });

    it('refuses an account with no factory scope', async () => {
      await post('/users', { ...body(), factoryIds: [] }).expect(400);
    });

    it('creates the user, exposing no credential field, able to log in', async () => {
      const response = await post('/users', body()).expect(201);

      const row = envelope<UserRow>(response).data;
      expect(Object.keys(row).sort()).toEqual([
        'factoryIds',
        'id',
        'name',
        'roles',
        'status',
        'username',
      ]);
      expect(row).toEqual(
        expect.objectContaining({
          username: newUsername,
          status: 'ACTIVE',
          roles: [],
          factoryIds: [factoryA],
        }),
      );
      newUserId = row.id;

      expect(await loginStatus(newUsername, 'Welcome123')).toBe(200);
    });

    it('refuses a duplicate username with 409', async () => {
      await post('/users', body()).expect(409);
    });
  });

  describe('roles', () => {
    it('assigns a role within the admin own permissions, idempotently', async () => {
      await post(`/users/${newUserId}/roles`, { roleCode: narrowRoleCode }).expect(200);
      const again = await post(`/users/${newUserId}/roles`, { roleCode: narrowRoleCode }).expect(
        200,
      );
      expect(envelope<UserRow>(again).data.roles).toEqual([narrowRoleCode]);
    });

    it('refuses a role carrying a permission the admin lacks', async () => {
      await post(`/users/${newUserId}/roles`, { roleCode: wideRoleCode }).expect(403);
    });

    it('rejects an unknown role code with 404', async () => {
      await post(`/users/${newUserId}/roles`, { roleCode: `NOPE_${suffix}` }).expect(404);
    });

    it('revokes a held role, 404 the second time', async () => {
      const response = await del(`/users/${newUserId}/roles/${narrowRoleCode}`).expect(200);
      expect(envelope<UserRow>(response).data.roles).toEqual([]);
      await del(`/users/${newUserId}/roles/${narrowRoleCode}`).expect(404);
    });
  });

  describe('factory scopes', () => {
    it('refuses a factory outside the admin scope', async () => {
      await post(`/users/${newUserId}/factory-scopes`, { factoryId: factoryB }).expect(403);
    });

    it('refuses to remove the last factory scope', async () => {
      await del(`/users/${newUserId}/factory-scopes/${factoryA}`).expect(400);
    });

    it('adds a second scope, then removes the first', async () => {
      const added = await post(`/users/${newUserId}/factory-scopes`, {
        factoryId: factoryC,
      }).expect(200);
      expect(envelope<UserRow>(added).data.factoryIds.sort()).toEqual([factoryA, factoryC].sort());

      const removed = await del(`/users/${newUserId}/factory-scopes/${factoryA}`).expect(200);
      expect(envelope<UserRow>(removed).data.factoryIds).toEqual([factoryC]);
    });
  });

  describe('edit and status', () => {
    it('renames and deactivates — a deactivated user can no longer log in', async () => {
      const response = await patch(`/users/${newUserId}`, {
        name: 'Renamed',
        status: 'INACTIVE',
      }).expect(200);
      expect(envelope<UserRow>(response).data).toEqual(
        expect.objectContaining({ name: 'Renamed', status: 'INACTIVE', username: newUsername }),
      );

      expect(await loginStatus(newUsername, 'Welcome123')).not.toBe(200);
    });

    it('refuses to let the admin deactivate their own account', async () => {
      await patch(`/users/${adminId}`, { status: 'INACTIVE' }).expect(400);
    });
  });

  it('audits user writes under CHANGE_CONFIGURATION', async () => {
    const count = await prisma.auditLog.count({
      where: {
        actorUserId: adminId,
        action: 'CHANGE_CONFIGURATION',
        entityType: 'User',
        entityId: newUserId,
      },
    });
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
