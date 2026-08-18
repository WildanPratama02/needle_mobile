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

interface Row {
  id: string;
  username: string;
  name: string;
  status: string;
  roles: string[];
  factoryIds: string[];
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * `.scratch/users-read-api/spec.md` (GAP-06). Same shape as
 * `master-data-query.e2e-spec.ts`: everything asserted at the HTTP boundary —
 * status code, envelope, rows returned, the scope boundary — nothing reaches
 * into the service or inspects a `where` clause.
 */
describe('Users directory (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const viewerUsername = `e2e_usr_viewer_${suffix}`;
  const outsiderUsername = `e2e_usr_outsider_${suffix}`;
  const nopermUsername = `e2e_usr_noperm_${suffix}`;
  const viewerRoleCode = `E2E_USR_VIEW_${suffix}`.toUpperCase();
  const nopermRoleCode = `E2E_USR_NONE_${suffix}`.toUpperCase();

  let viewerToken: string;
  let nopermToken: string;

  let homeFactoryId: string;
  let otherFactoryId: string;
  let viewerUserId: string;
  let outsiderUserId: string;

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

    const viewerUser = await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E Users Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    viewerUserId = viewerUser.id;

    // Holds USER_MANAGE, but only for the factory created above — out of the
    // viewer's scope, and the row the "never returns another factory's user" test needs.
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

    await prisma.user.create({
      data: {
        username: nopermUsername,
        name: 'E2E Users No Permission',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: nopermRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });

    viewerToken = await login(viewerUsername);
    nopermToken = await login(nopermUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [viewerUsername, outsiderUsername, nopermUsername] } },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);

      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [viewerRoleCode, nopermRoleCode] } } });
      await prisma.factory.deleteMany({ where: { id: otherFactoryId } });
    }
    await app?.close();
  });

  describe('authorized reads', () => {
    it('returns rows from /users', async () => {
      const response = await get(viewerToken, '/users').expect(200);
      const body = envelope<Row[]>(response);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('uses the paginated envelope', async () => {
      const response = await get(viewerToken, '/users').expect(200);

      expect(envelope<Row[]>(response).meta).toEqual(
        expect.objectContaining({
          requestId: expect.any(String) as string,
          page: expect.any(Number) as number,
          pageSize: expect.any(Number) as number,
          total: expect.any(Number) as number,
          totalPages: expect.any(Number) as number,
        }),
      );
    });

    it('exposes no credential-bearing field — the exact field set, not just the expected ones', async () => {
      const response = await get(viewerToken, `/users/${viewerUserId}`).expect(200);
      const row = envelope<Record<string, unknown>>(response).data;

      expect(Object.keys(row).sort()).toEqual(
        ['factoryIds', 'id', 'name', 'roles', 'status', 'username'].sort(),
      );
    });

    it('exposes role codes and factory ids on every row', async () => {
      const response = await get(viewerToken, '/users').expect(200);

      for (const row of envelope<Row[]>(response).data) {
        expect(typeof row.id).toBe('string');
        expect(typeof row.username).toBe('string');
        expect(typeof row.name).toBe('string');
        expect(typeof row.status).toBe('string');
        expect(Array.isArray(row.roles)).toBe(true);
        expect(Array.isArray(row.factoryIds)).toBe(true);
      }
    });

    it('fetches a single user by id', async () => {
      const response = await get(viewerToken, `/users/${viewerUserId}`).expect(200);
      const row = envelope<Row>(response).data;

      expect(row.id).toBe(viewerUserId);
      expect(row.username).toBe(viewerUsername);
      expect(row.roles).toContain(viewerRoleCode);
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

    it('rejects a caller without USER_MANAGE on the list', async () => {
      const response = await get(nopermToken, '/users').expect(403);

      expect(envelope<unknown>(response).success).toBe(false);
    });

    it('rejects a caller without USER_MANAGE on a single row', async () => {
      await get(nopermToken, `/users/${viewerUserId}`).expect(403);
    });
  });

  describe('factory scope', () => {
    it('returns only users the caller shares a factory with', async () => {
      const response = await get(viewerToken, '/users?pageSize=100').expect(200);
      const ids = envelope<Row[]>(response).data.map((row) => row.id);

      expect(ids).toContain(viewerUserId);
      expect(ids).not.toContain(outsiderUserId);
    });

    it('cannot widen list scope by naming another factory', async () => {
      const response = await get(viewerToken, `/users?factoryId=${otherFactoryId}`).expect(200);

      expect(envelope<Row[]>(response).data).toEqual([]);
    });

    it('refuses a single-row fetch for a user outside the caller factory scope', async () => {
      await get(viewerToken, `/users/${outsiderUserId}`).expect(403);
    });

    it('never returns another factory in factoryIds for an in-scope user', async () => {
      const response = await get(viewerToken, `/users/${viewerUserId}`).expect(200);

      expect(envelope<Row>(response).data.factoryIds).toEqual([homeFactoryId]);
    });
  });

  describe('pagination', () => {
    it('caps page size at 100 and reports a consistent total', async () => {
      const response = await get(viewerToken, '/users?pageSize=500').expect(200);
      const body = envelope<Row[]>(response);

      expect(body.meta.pageSize).toBeLessThanOrEqual(100);
      expect(body.meta.total).toBeGreaterThanOrEqual(body.data.length);
    });
  });
});
