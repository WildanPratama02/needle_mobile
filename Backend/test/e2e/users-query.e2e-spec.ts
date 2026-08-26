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
  meta: {
    requestId: string;
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
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
 * `/users` read-only directory (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * Same shape as `master-data-query.e2e-spec.ts`: assert what a caller can
 * observe at the HTTP boundary — status code, envelope, rows returned, the
 * scope boundary — never a service's internal `where` clause.
 */
describe('Users query (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const viewerUsername = `e2e_usr_viewer_${suffix}`;
  const outsiderUsername = `e2e_usr_outsider_${suffix}`;
  const nopermUsername = `e2e_usr_noperm_${suffix}`;
  const viewerRoleCode = `E2E_USR_VIEW_${suffix}`.toUpperCase();
  const nopermRoleCode = `E2E_USR_NONE_${suffix}`.toUpperCase();
  const subjectRoleCode = `E2E_USR_SUBJECT_${suffix}`.toUpperCase();

  let viewerToken: string;
  let outsiderToken: string;
  let nopermToken: string;

  let homeFactoryId: string;
  let otherFactoryId: string;
  let viewerUserId: string;
  let outsiderUserId: string;
  let nopermUserId: string;

  const server = () => app.getHttpServer() as Server;
  const as = (token: string) => (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  const login = async (username: string): Promise<string> => {
    const response = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);
    return envelope<{ accessToken: string }>(response).data.accessToken;
  };

  const get = (token: string, path: string) => as(token)(request(server()).get(`/api/v1${path}`));

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const seededTrolley = await prisma.trolley.findFirstOrThrow();
    homeFactoryId = seededTrolley.factoryId;

    const other = await prisma.factory.create({
      data: {
        code: `FAC-USR-${suffix}`,
        name: 'Users e2e other factory',
        timezone: 'Asia/Jakarta',
      },
    });
    otherFactoryId = other.id;

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const viewPermissions = await permissionFor([PERMISSIONS.USER_MANAGE]);
    const otherPermissions = await permissionFor([PERMISSIONS.EXCHANGE_VIEW]);

    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E users viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const nopermRole = await prisma.role.create({
      data: {
        code: nopermRoleCode,
        name: 'E2E no user-manage',
        permissions: { create: otherPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    // A distinct role code so the "roles" field on the list/detail response
    // has something specific to assert against.
    const subjectRole = await prisma.role.create({
      data: { code: subjectRoleCode, name: 'E2E users subject role' },
    });

    const viewerUser = await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E Users Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }, { roleId: subjectRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    viewerUserId = viewerUser.id;

    // Holds USER_MANAGE, but only for the other factory.
    const outsiderUser = await prisma.user.create({
      data: {
        username: outsiderUsername,
        name: 'E2E Users Outsider',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: otherFactoryId }] },
      },
    });
    outsiderUserId = outsiderUser.id;

    const nopermUser = await prisma.user.create({
      data: {
        username: nopermUsername,
        name: 'E2E Users No Permission',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: nopermRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    nopermUserId = nopermUser.id;

    viewerToken = await login(viewerUsername);
    outsiderToken = await login(outsiderUsername);
    nopermToken = await login(nopermUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const userIds = [viewerUserId, outsiderUserId, nopermUserId];
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({
        where: { code: { in: [viewerRoleCode, nopermRoleCode, subjectRoleCode] } },
      });
      await prisma.factory.deleteMany({ where: { id: otherFactoryId } });
    }
    await app?.close();
  });

  describe('authorized reads', () => {
    it('returns rows using the paginated envelope', async () => {
      const response = await get(viewerToken, '/users').expect(200);
      const body = envelope<UserRow[]>(response);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.meta).toEqual(
        expect.objectContaining({
          requestId: expect.any(String) as string,
          page: expect.any(Number) as number,
          pageSize: expect.any(Number) as number,
          total: expect.any(Number) as number,
          totalPages: expect.any(Number) as number,
        }),
      );
    });

    it('exposes exactly the documented field set — no credential-bearing field', async () => {
      const response = await get(viewerToken, `/users/${viewerUserId}`).expect(200);
      const row = envelope<Record<string, unknown>>(response).data;

      expect(Object.keys(row).sort()).toEqual(
        ['id', 'username', 'name', 'status', 'roles', 'factoryIds'].sort(),
      );
      expect(row).not.toHaveProperty('passwordHash');
      expect(row).not.toHaveProperty('refreshTokens');
      expect(row).not.toHaveProperty('lastLoginAt');
      expect(row).not.toHaveProperty('email');
      expect(row).not.toHaveProperty('phoneNumber');
    });

    it('shows status and role codes on a list row', async () => {
      const response = await get(viewerToken, '/users?pageSize=100').expect(200);
      const row = envelope<UserRow[]>(response).data.find((item) => item.id === viewerUserId);

      expect(row).toBeDefined();
      expect(row?.status).toBe('ACTIVE');
      expect(row?.roles).toEqual(expect.arrayContaining([subjectRoleCode]));
      expect(Array.isArray(row?.factoryIds)).toBe(true);
    });

    it('fetches a single user by id', async () => {
      const response = await get(viewerToken, `/users/${viewerUserId}`).expect(200);
      const row = envelope<UserRow>(response).data;

      expect(row.id).toBe(viewerUserId);
      expect(row.username).toBe(viewerUsername);
    });

    it('returns 404 for an unknown id', async () => {
      await get(viewerToken, '/users/8f14e45f-ceea-467a-9f5a-000000000000').expect(404);
    });

    it('rejects a malformed id', async () => {
      await get(viewerToken, '/users/not-a-uuid').expect(400);
    });
  });

  describe('authorization', () => {
    it('rejects an unauthenticated request', async () => {
      await request(server()).get('/api/v1/users').expect(401);
    });

    it('rejects a caller without USER_MANAGE', async () => {
      const response = await get(nopermToken, '/users').expect(403);

      expect(envelope<unknown>(response).success).toBe(false);
    });

    it('rejects a by-id read for a caller without USER_MANAGE', async () => {
      await get(nopermToken, `/users/${viewerUserId}`).expect(403);
    });
  });

  describe('factory scope', () => {
    it('returns only users scoped to the caller factory', async () => {
      const response = await get(viewerToken, '/users?pageSize=100').expect(200);
      const ids = envelope<UserRow[]>(response).data.map((row) => row.id);

      expect(ids).toContain(viewerUserId);
      expect(ids).not.toContain(outsiderUserId);
    });

    it('cannot widen scope by naming another factory', async () => {
      const response = await get(viewerToken, `/users?factoryId=${otherFactoryId}`).expect(200);

      expect(envelope<UserRow[]>(response).data).toEqual([]);
    });

    it('lets the outsider read its own factory rows', async () => {
      const response = await get(outsiderToken, '/users?pageSize=100').expect(200);
      const ids = envelope<UserRow[]>(response).data.map((row) => row.id);

      expect(ids).toEqual([outsiderUserId]);
    });

    it('refuses a by-id read of an out-of-scope user', async () => {
      await get(viewerToken, `/users/${outsiderUserId}`).expect(403);
    });
  });

  describe('ordering and pagination', () => {
    it('orders by username ascending', async () => {
      const response = await get(viewerToken, '/users?pageSize=100').expect(200);
      const usernames = envelope<UserRow[]>(response).data.map((row) => row.username);

      expect(usernames).toEqual([...usernames].sort((a, b) => a.localeCompare(b)));
    });

    it('caps an oversized pageSize', async () => {
      const response = await get(viewerToken, '/users?pageSize=5000').expect(200);

      expect(envelope<UserRow[]>(response).meta.pageSize).toBe(100);
    });

    it('rejects a page below one', async () => {
      await get(viewerToken, '/users?page=0').expect(400);
    });

    it('rejects a filter the contract does not define', async () => {
      await get(viewerToken, '/users?bogusFilter=x').expect(400);
    });

    it('rejects a role value the contract does not define', async () => {
      // `role=<code>` (.scratch/roles-permissions/spec.md) only accepts the
      // five seeded ROLES codes — an arbitrary/custom role code (like this
      // suite's own e2e-only roles) is not a valid filter value. Actual
      // role-filtering behavior is covered in roles.e2e-spec.ts against the
      // seeded ROLES codes.
      await get(viewerToken, `/users?role=${subjectRoleCode}`).expect(400);
    });

    it('paginates without repeating or dropping a row', async () => {
      const first = await get(viewerToken, '/users?page=1&pageSize=1').expect(200);
      const second = await get(viewerToken, '/users?page=2&pageSize=1').expect(200);

      const firstIds = envelope<UserRow[]>(first).data.map((row) => row.id);
      const secondIds = envelope<UserRow[]>(second).data.map((row) => row.id);

      expect(firstIds).toHaveLength(1);
      expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([]);
    });
  });

  describe('read-only', () => {
    it.each(['post', 'put', 'patch', 'delete'] as const)(
      'exposes no %s route on /users',
      async (method) => {
        await as(viewerToken)(request(server())[method]('/api/v1/users')).expect(404);
      },
    );

    it('leaves the row count unchanged after querying', async () => {
      const before = await prisma.user.count();

      await get(viewerToken, '/users?pageSize=100').expect(200);

      expect(await prisma.user.count()).toBe(before);
    });
  });
});
