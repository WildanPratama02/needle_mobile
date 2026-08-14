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
  code: string;
  name: string;
  status: string;
  factoryId?: string;
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * Read-only master data (`.scratch/master-data/spec.md`).
 *
 * Everything is asserted at the HTTP boundary: status code, envelope, rows
 * returned and the scope boundary. Nothing here reaches into a service or
 * inspects a `where` clause — the test that survives a refactor is "a caller
 * scoped to factory A receives no factory B rows", not "the query contained
 * an `in` filter".
 *
 * The two scope classes are the point of this suite. `Factory`, `Trolley`,
 * `Location` and `Employee` are factory-scoped; `NeedleType` and
 * `ExchangeType` carry no `factoryId` at all and are global catalogues.
 */
describe('Master data query (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const viewerUsername = `e2e_md_viewer_${suffix}`;
  const outsiderUsername = `e2e_md_outsider_${suffix}`;
  const nopermUsername = `e2e_md_noperm_${suffix}`;
  const viewerRoleCode = `E2E_MD_VIEW_${suffix}`.toUpperCase();
  const nopermRoleCode = `E2E_MD_NONE_${suffix}`.toUpperCase();

  let viewerToken: string;
  let outsiderToken: string;
  let nopermToken: string;

  let homeFactoryId: string;
  let otherFactoryId: string;
  let otherTrolleyId: string;
  let otherLocationId: string;
  let otherEmployeeId: string;

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

    // A second factory with its own location, trolley and employee, so "never
    // returns another factory's rows" has something real to exclude.
    const other = await prisma.factory.create({
      data: { code: `FAC-MD-${suffix}`, name: 'MD other factory', timezone: 'Asia/Jakarta' },
    });
    otherFactoryId = other.id;

    const otherLocation = await prisma.location.create({
      data: {
        factoryId: otherFactoryId,
        code: `LOC-MD-${suffix}`,
        name: 'MD other trolley location',
        locationType: 'TROLLEY',
      },
    });
    otherLocationId = otherLocation.id;

    const otherTrolley = await prisma.trolley.create({
      data: {
        factoryId: otherFactoryId,
        locationId: otherLocationId,
        code: `TRL-MD-${suffix}`,
        name: 'MD other trolley',
      },
    });
    otherTrolleyId = otherTrolley.id;

    const otherEmployee = await prisma.employee.create({
      data: {
        employeeNumber: `EMP-MD-${suffix}`,
        name: 'MD other employee',
        factoryId: otherFactoryId,
      },
    });
    otherEmployeeId = otherEmployee.id;

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const viewPermissions = await permissionFor([PERMISSIONS.MASTER_VIEW]);
    const otherPermissions = await permissionFor([PERMISSIONS.EXCHANGE_VIEW]);

    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E master-data viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const nopermRole = await prisma.role.create({
      data: {
        code: nopermRoleCode,
        name: 'E2E no master-data',
        permissions: { create: otherPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E MD Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });

    // Holds MASTER_VIEW, but only for the factory created above.
    await prisma.user.create({
      data: {
        username: outsiderUsername,
        name: 'E2E MD Outsider',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: otherFactoryId }] },
      },
    });

    await prisma.user.create({
      data: {
        username: nopermUsername,
        name: 'E2E MD No Permission',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: nopermRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });

    viewerToken = await login(viewerUsername);
    outsiderToken = await login(outsiderUsername);
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
      await prisma.employee.deleteMany({ where: { id: otherEmployeeId } });
      await prisma.trolley.deleteMany({ where: { id: otherTrolleyId } });
      await prisma.location.deleteMany({ where: { id: otherLocationId } });
      await prisma.factory.deleteMany({ where: { id: otherFactoryId } });
    }
    await app?.close();
  });

  const COLLECTIONS = [
    '/factories',
    '/locations',
    '/trolleys',
    '/needle-types',
    '/exchange-types',
    '/employees',
  ] as const;

  const FACTORY_SCOPED = ['/factories', '/locations', '/trolleys', '/employees'] as const;
  const GLOBAL_CATALOGUES = ['/needle-types', '/exchange-types'] as const;

  describe('authorized reads', () => {
    it.each(COLLECTIONS)('returns rows from %s', async (path) => {
      const response = await get(viewerToken, path).expect(200);
      const body = envelope<Row[]>(response);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it.each(COLLECTIONS)('uses the paginated envelope on %s', async (path) => {
      const response = await get(viewerToken, path).expect(200);

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

    it.each(COLLECTIONS)('exposes code and name on every %s row', async (path) => {
      const response = await get(viewerToken, path).expect(200);

      for (const row of envelope<Row[]>(response).data) {
        expect(typeof row.id).toBe('string');
        expect(typeof row.code).toBe('string');
        expect(typeof row.name).toBe('string');
        expect(typeof row.status).toBe('string');
      }
    });

    it.each(COLLECTIONS)('fetches a single row by id from %s', async (path) => {
      const list = await get(viewerToken, path).expect(200);
      const [first] = envelope<Row[]>(list).data;

      const response = await get(viewerToken, `${path}/${first.id}`).expect(200);
      const row = envelope<Row>(response).data;

      expect(row.id).toBe(first.id);
      expect(row.code).toBe(first.code);
    });

    it.each(COLLECTIONS)('returns 404 for an unknown id on %s', async (path) => {
      await get(viewerToken, `${path}/8f14e45f-ceea-467a-9f5a-000000000000`).expect(404);
    });

    it.each(COLLECTIONS)('rejects a malformed id on %s', async (path) => {
      await get(viewerToken, `${path}/not-a-uuid`).expect(400);
    });

    it('exposes the fields a needle type screen needs', async () => {
      const response = await get(viewerToken, '/needle-types').expect(200);
      const [row] = envelope<Record<string, unknown>[]>(response).data;

      expect(row).toEqual(
        expect.objectContaining({
          unit: expect.any(String) as string,
          minimumStock: expect.anything() as unknown,
        }),
      );
    });

    it('reports which exchange types require fragment validation', async () => {
      const response = await get(viewerToken, '/exchange-types').expect(200);
      const rows = envelope<{ code: string; requiresFragmentValidation: boolean }[]>(response).data;

      const broken = rows.find((row) => row.code === 'BROKEN');
      expect(broken?.requiresFragmentValidation).toBe(true);
    });

    it('exposes the employee number', async () => {
      const response = await get(viewerToken, '/employees').expect(200);
      const [row] = envelope<{ employeeNumber: string }[]>(response).data;

      expect(typeof row.employeeNumber).toBe('string');
    });

    it('exposes the location type', async () => {
      const response = await get(viewerToken, '/locations').expect(200);
      const [row] = envelope<{ locationType: string }[]>(response).data;

      expect(typeof row.locationType).toBe('string');
    });
  });

  describe('authorization', () => {
    it.each(COLLECTIONS)('rejects an unauthenticated request to %s', async (path) => {
      await request(server()).get(`/api/v1${path}`).expect(401);
    });

    it.each(COLLECTIONS)('rejects a caller without MASTER_VIEW on %s', async (path) => {
      const response = await get(nopermToken, path).expect(403);

      expect(envelope<unknown>(response).success).toBe(false);
    });
  });

  describe('factory scope', () => {
    it('returns only factories the caller is scoped to', async () => {
      const response = await get(viewerToken, '/factories?pageSize=100').expect(200);
      const ids = envelope<Row[]>(response).data.map((row) => row.id);

      expect(ids).toContain(homeFactoryId);
      expect(ids).not.toContain(otherFactoryId);
    });

    it.each(['/locations', '/trolleys', '/employees'] as const)(
      'never returns a %s row outside the caller factory scope',
      async (path) => {
        const response = await get(viewerToken, `${path}?pageSize=100`).expect(200);

        for (const row of envelope<Row[]>(response).data) {
          expect(row.factoryId).toBe(homeFactoryId);
        }
      },
    );

    it.each(FACTORY_SCOPED)('cannot widen %s scope by naming another factory', async (path) => {
      const response = await get(viewerToken, `${path}?factoryId=${otherFactoryId}`).expect(200);

      expect(envelope<Row[]>(response).data).toEqual([]);
    });

    it('refuses a by-id read of an out-of-scope trolley', async () => {
      await get(viewerToken, `/trolleys/${otherTrolleyId}`).expect(403);
    });

    it('refuses a by-id read of an out-of-scope factory', async () => {
      await get(viewerToken, `/factories/${otherFactoryId}`).expect(403);
    });

    it('lets the outsider read its own factory rows', async () => {
      const response = await get(outsiderToken, '/trolleys?pageSize=100').expect(200);
      const ids = envelope<Row[]>(response).data.map((row) => row.id);

      expect(ids).toEqual([otherTrolleyId]);
    });

    it.each(GLOBAL_CATALOGUES)(
      'returns %s to every scope, being a global catalogue',
      async (path) => {
        const mine = await get(viewerToken, `${path}?pageSize=100`).expect(200);
        const theirs = await get(outsiderToken, `${path}?pageSize=100`).expect(200);

        expect(envelope<Row[]>(theirs).data.length).toBeGreaterThan(0);
        expect(envelope<Row[]>(theirs).data.map((row) => row.id)).toEqual(
          envelope<Row[]>(mine).data.map((row) => row.id),
        );
      },
    );

    it.each(GLOBAL_CATALOGUES)('rejects a factoryId filter on %s', async (path) => {
      await get(viewerToken, `${path}?factoryId=${homeFactoryId}`).expect(400);
    });
  });

  describe('filters, ordering and pagination', () => {
    it.each(COLLECTIONS)('orders %s by code ascending', async (path) => {
      const response = await get(viewerToken, `${path}?pageSize=100`).expect(200);
      const codes = envelope<Row[]>(response).data.map((row) => row.code);

      expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b)));
    });

    it.each(COLLECTIONS)('filters %s by status', async (path) => {
      const response = await get(viewerToken, `${path}?status=ACTIVE&pageSize=100`).expect(200);

      expect(envelope<Row[]>(response).data.every((row) => row.status === 'ACTIVE')).toBe(true);
    });

    it.each(COLLECTIONS)('rejects an unknown status on %s', async (path) => {
      await get(viewerToken, `${path}?status=NOT_A_STATUS`).expect(400);
    });

    it.each(COLLECTIONS)('rejects a filter the contract does not define on %s', async (path) => {
      await get(viewerToken, `${path}?search=anything`).expect(400);
    });

    it.each(COLLECTIONS)('caps an oversized pageSize on %s', async (path) => {
      const response = await get(viewerToken, `${path}?pageSize=5000`).expect(200);

      expect(envelope<Row[]>(response).meta.pageSize).toBe(100);
    });

    it.each(COLLECTIONS)('rejects a page below one on %s', async (path) => {
      await get(viewerToken, `${path}?page=0`).expect(400);
    });

    it('paginates without repeating or dropping a row', async () => {
      const first = await get(viewerToken, '/needle-types?page=1&pageSize=1').expect(200);
      const second = await get(viewerToken, '/needle-types?page=2&pageSize=1').expect(200);

      const firstIds = envelope<Row[]>(first).data.map((row) => row.id);
      const secondIds = envelope<Row[]>(second).data.map((row) => row.id);

      expect(firstIds).toHaveLength(1);
      expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([]);
    });

    it('is stable across identical repeated requests', async () => {
      const a = await get(viewerToken, '/needle-types?page=1&pageSize=5').expect(200);
      const b = await get(viewerToken, '/needle-types?page=1&pageSize=5').expect(200);

      expect(envelope<Row[]>(a).data.map((row) => row.id)).toEqual(
        envelope<Row[]>(b).data.map((row) => row.id),
      );
    });

    it('reports an empty page honestly', async () => {
      const response = await get(viewerToken, '/trolleys?page=500&pageSize=100').expect(200);
      const body = envelope<Row[]>(response);

      expect(body.data).toEqual([]);
      expect(body.meta.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('read-only', () => {
    it.each(['post', 'put', 'patch', 'delete'] as const)(
      'exposes no %s route on a master-data collection',
      async (method) => {
        await as(viewerToken)(request(server())[method]('/api/v1/needle-types')).expect(404);
      },
    );

    it('exposes no write route on an individual row', async () => {
      const list = await get(viewerToken, '/needle-types?pageSize=1').expect(200);
      const [row] = envelope<Row[]>(list).data;

      await as(viewerToken)(request(server()).patch(`/api/v1/needle-types/${row.id}`)).expect(404);
      await as(viewerToken)(request(server()).delete(`/api/v1/needle-types/${row.id}`)).expect(404);
    });

    it('leaves the row count unchanged after querying', async () => {
      const before = await prisma.needleType.count();

      await get(viewerToken, '/needle-types?pageSize=100').expect(200);

      expect(await prisma.needleType.count()).toBe(before);
    });
  });
});
