import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { AUDIT_ACTIONS } from '../../src/common/decorators/audit.decorator';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';
import { createTestApp } from './create-test-app';

interface AuditRow {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  factoryId: string | null;
  requestId: string | null;
}

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

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * Read-only audit query endpoint (issue 16, Docs/12 §17).
 *
 * Records are produced by driving real audited actions through the API, so
 * this also proves the issue 10 write path still works end to end.
 */
describe('Audit query (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_aq_pic_${suffix}`;
  const viewerUsername = `e2e_aq_viewer_${suffix}`;
  const outsiderUsername = `e2e_aq_outsider_${suffix}`;
  const picRoleCode = `E2E_AQ_PIC_${suffix}`.toUpperCase();
  const viewerRoleCode = `E2E_AQ_VIEW_${suffix}`.toUpperCase();

  let picToken: string;
  let viewerToken: string;
  let outsiderToken: string;
  let picUserId: string;
  let otherFactoryId: string;
  let ids: { factoryId: string; trolleyId: string; deviceId: string };
  let sequence = 0;

  const server = () => app.getHttpServer() as Server;
  const as = (token: string) => (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  const login = async (username: string): Promise<string> => {
    const response = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);
    return envelope<{ accessToken: string }>(response).data.accessToken;
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const trolley = await prisma.trolley.findFirstOrThrow();
    const device = await prisma.device.findFirstOrThrow();
    ids = { factoryId: trolley.factoryId, trolleyId: trolley.id, deviceId: device.id };

    const other = await prisma.factory.create({
      data: { code: `FAC-AQ-${suffix}`, name: 'Other factory', timezone: 'Asia/Jakarta' },
    });
    otherFactoryId = other.id;

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const picPermissions = await permissionFor([
      PERMISSIONS.EXCHANGE_CREATE,
      PERMISSIONS.EXCHANGE_CANCEL,
    ]);
    const viewPermissions = await permissionFor([PERMISSIONS.AUDIT_VIEW]);

    const picRole = await prisma.role.create({
      data: {
        code: picRoleCode,
        name: 'E2E audit-query PIC',
        permissions: { create: picPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E audit viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    const pic = await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E AQ PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: picRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });
    picUserId = pic.id;

    await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E AQ Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });

    // Holds AUDIT_VIEW but is scoped to a different factory entirely.
    await prisma.user.create({
      data: {
        username: outsiderUsername,
        name: 'E2E AQ Outsider',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: otherFactoryId }] },
      },
    });

    picToken = await login(picUsername);
    viewerToken = await login(viewerUsername);
    outsiderToken = await login(outsiderUsername);

    // Produce audit records through the real write path (issue 10).
    for (let i = 0; i < 3; i += 1) {
      sequence += 1;
      const created = await as(picToken)(request(server()).post('/api/v1/exchanges'))
        .set('X-Request-ID', `aq-${suffix}-${sequence}`)
        .send({
          clientTransactionId: `aq-${suffix}-${sequence}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(201);

      const id = envelope<{ id: string }>(created).data.id;
      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/cancel`))
        .send({ reason: 'audit query fixture' })
        .expect(200);
    }
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [picUsername, viewerUsername, outsiderUsername] } },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);

      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
      await prisma.exchange.deleteMany({ where: { picUserId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [picRoleCode, viewerRoleCode] } } });
      await prisma.factory.deleteMany({ where: { id: otherFactoryId } });
    }
    await app?.close();
  });

  const query = (token: string, qs = '') =>
    as(token)(request(server()).get(`/api/v1/audit-logs${qs}`));

  describe('authorized access', () => {
    it('returns audit records written by the issue 10 interceptor', async () => {
      const response = await query(viewerToken).expect(200);
      const body = envelope<AuditRow[]>(response);

      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data.map((row) => row.action)).toEqual(
        expect.arrayContaining([AUDIT_ACTIONS.CREATE_EXCHANGE, AUDIT_ACTIONS.CANCEL_EXCHANGE]),
      );
    });

    it('carries the request id recorded at write time', async () => {
      const response = await query(
        viewerToken,
        `?action=${AUDIT_ACTIONS.CREATE_EXCHANGE}&pageSize=100`,
      ).expect(200);

      const mine = envelope<AuditRow[]>(response).data.filter((row) =>
        row.requestId?.startsWith(`aq-${suffix}`),
      );
      expect(mine.length).toBeGreaterThan(0);
    });

    it('uses the paginated response envelope', async () => {
      const response = await query(viewerToken).expect(200);
      const body = envelope<AuditRow[]>(response);

      expect(Array.isArray(body.data)).toBe(true);
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
  });

  describe('authorization and scope', () => {
    it('rejects an unauthenticated request', async () => {
      await request(server()).get('/api/v1/audit-logs').expect(401);
    });

    it('rejects a caller without AUDIT_VIEW', async () => {
      const response = await query(picToken).expect(403);

      expect(envelope<unknown>(response).success).toBe(false);
    });

    // Holds the permission, but none of these records belong to its factory.
    it('returns nothing to a viewer scoped to another factory', async () => {
      const response = await query(outsiderToken).expect(200);

      expect(envelope<AuditRow[]>(response).data).toEqual([]);
    });

    it('never returns a record outside the caller factory scope', async () => {
      const response = await query(viewerToken, '?pageSize=100').expect(200);

      for (const row of envelope<AuditRow[]>(response).data) {
        expect(row.factoryId).toBe(ids.factoryId);
      }
    });

    it('cannot widen scope by asking for another factory', async () => {
      const response = await query(viewerToken, `?factoryId=${otherFactoryId}`).expect(200);

      expect(envelope<AuditRow[]>(response).data).toEqual([]);
    });
  });

  describe('filters', () => {
    it('filters by action', async () => {
      const response = await query(
        viewerToken,
        `?action=${AUDIT_ACTIONS.CANCEL_EXCHANGE}&pageSize=100`,
      ).expect(200);

      const rows = envelope<AuditRow[]>(response).data;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.action === AUDIT_ACTIONS.CANCEL_EXCHANGE)).toBe(true);
    });

    it('filters by entityType', async () => {
      const response = await query(viewerToken, '?entityType=Exchange&pageSize=100').expect(200);

      expect(
        envelope<AuditRow[]>(response).data.every((row) => row.entityType === 'Exchange'),
      ).toBe(true);
    });

    it('filters by entityId', async () => {
      const all = await query(viewerToken, '?pageSize=100').expect(200);
      const target = envelope<AuditRow[]>(all).data.find((row) => row.entityId !== null)!;

      const response = await query(viewerToken, `?entityId=${target.entityId}`).expect(200);

      const rows = envelope<AuditRow[]>(response).data;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.entityId === target.entityId)).toBe(true);
    });

    it('filters by actorUserId', async () => {
      const response = await query(viewerToken, `?actorUserId=${picUserId}&pageSize=100`).expect(
        200,
      );

      const rows = envelope<AuditRow[]>(response).data;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.actorUserId === picUserId)).toBe(true);
    });

    it('filters by date range', async () => {
      const from = new Date(Date.now() - 3600 * 1000).toISOString();
      const to = new Date(Date.now() + 3600 * 1000).toISOString();

      const inRange = await query(
        viewerToken,
        `?dateFrom=${from}&dateTo=${to}&pageSize=100`,
      ).expect(200);
      expect(envelope<AuditRow[]>(inRange).data.length).toBeGreaterThan(0);

      const past = new Date('2020-01-01T00:00:00.000Z').toISOString();
      const alsoPast = new Date('2020-12-31T00:00:00.000Z').toISOString();
      const outOfRange = await query(viewerToken, `?dateFrom=${past}&dateTo=${alsoPast}`).expect(
        200,
      );
      expect(envelope<AuditRow[]>(outOfRange).data).toEqual([]);
    });

    it('returns an empty page when nothing matches', async () => {
      const response = await query(viewerToken, '?action=NO_SUCH_ACTION').expect(200);
      const body = envelope<AuditRow[]>(response);

      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
      expect(body.meta.totalPages).toBe(0);
    });

    it('rejects a filter the specification does not define', async () => {
      await query(viewerToken, '?deviceId=anything').expect(400);
    });

    it('rejects a malformed uuid filter', async () => {
      await query(viewerToken, '?actorUserId=not-a-uuid').expect(400);
    });

    it('rejects a malformed date', async () => {
      await query(viewerToken, '?dateFrom=not-a-date').expect(400);
    });

    it('rejects a page below one', async () => {
      await query(viewerToken, '?page=0').expect(400);
    });
  });

  describe('ordering and pagination', () => {
    it('returns newest first', async () => {
      const response = await query(viewerToken, '?pageSize=100').expect(200);
      const times = envelope<AuditRow[]>(response).data.map((row) => Date.parse(row.timestamp));

      for (let i = 1; i < times.length; i += 1) {
        expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
      }
    });

    it('paginates without repeating or dropping a record', async () => {
      const first = await query(viewerToken, '?page=1&pageSize=2').expect(200);
      const second = await query(viewerToken, '?page=2&pageSize=2').expect(200);

      const firstIds = envelope<AuditRow[]>(first).data.map((row) => row.id);
      const secondIds = envelope<AuditRow[]>(second).data.map((row) => row.id);

      expect(firstIds).toHaveLength(2);
      expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([]);
    });

    it('is stable across identical repeated requests', async () => {
      const a = await query(viewerToken, '?page=1&pageSize=5').expect(200);
      const b = await query(viewerToken, '?page=1&pageSize=5').expect(200);

      expect(envelope<AuditRow[]>(a).data.map((row) => row.id)).toEqual(
        envelope<AuditRow[]>(b).data.map((row) => row.id),
      );
    });

    it('caps an oversized pageSize', async () => {
      const response = await query(viewerToken, '?pageSize=5000').expect(200);

      expect(envelope<AuditRow[]>(response).meta.pageSize).toBe(100);
    });
  });

  describe('immutability', () => {
    // The interceptor is the only writer; the read module exposes no other verb.
    it.each(['post', 'put', 'patch', 'delete'] as const)(
      'exposes no %s route on the collection',
      async (method) => {
        await as(viewerToken)(request(server())[method]('/api/v1/audit-logs')).expect(404);
      },
    );

    it('exposes no route for an individual record', async () => {
      const response = await query(viewerToken, '?pageSize=1').expect(200);
      const [row] = envelope<AuditRow[]>(response).data;

      await as(viewerToken)(request(server()).delete(`/api/v1/audit-logs/${row.id}`)).expect(404);
    });

    it('leaves the record count unchanged after querying', async () => {
      const before = await prisma.auditLog.count();

      await query(viewerToken, '?pageSize=100').expect(200);

      expect(await prisma.auditLog.count()).toBe(before);
    });
  });
});
