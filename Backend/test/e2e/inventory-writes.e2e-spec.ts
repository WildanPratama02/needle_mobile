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

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

interface CountItem {
  needleTypeId: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
}

interface CountDetail {
  id: string;
  status: string;
  items: CountItem[];
}

/**
 * Stock Return and Physical Count (`.scratch/admin-panel-crud/issues/04`–`05`),
 * plus FR-WEB-017's "an inactive factory takes no new transactions".
 * Runs in its own factory so balances start from zero.
 */
describe('Inventory writes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const clerkUsername = `e2e_inv_clerk_${suffix}`;
  const viewerUsername = `e2e_inv_viewer_${suffix}`;
  const clerkRoleCode = `E2E_INV_CLERK_${suffix}`.toUpperCase();
  const viewerRoleCode = `E2E_INV_VIEW_${suffix}`.toUpperCase();

  let clerkToken: string;
  let viewerToken: string;
  let factoryId: string;
  let locationA: string;
  let locationB: string;
  let needleTypeId: string;

  const server = () => app.getHttpServer() as Server;
  const as = (token: string) => (req: request.Test) => req.set('Authorization', `Bearer ${token}`);
  const get = (token: string, path: string) => as(token)(request(server()).get(`/api/v1${path}`));
  const post = (token: string, path: string, body: object = {}) =>
    as(token)(request(server()).post(`/api/v1${path}`).send(body));

  const login = async (username: string): Promise<string> => {
    const response = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);
    return envelope<{ accessToken: string }>(response).data.accessToken;
  };

  const receive = (quantity: number) =>
    post(clerkToken, '/inventory/receivings', {
      factoryId,
      destinationLocationId: locationA,
      needleTypeId,
      quantity,
    });

  const balanceAt = async (locationId: string): Promise<number> => {
    const row = await prisma.inventoryBalance.findUnique({
      where: { locationId_needleTypeId: { locationId, needleTypeId } },
    });
    return row ? Number(row.quantity) : 0;
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const factory = await prisma.factory.create({
      data: { code: `FAC-INV-${suffix}`, name: 'Inventory e2e factory', timezone: 'Asia/Jakarta' },
    });
    factoryId = factory.id;
    locationA = (
      await prisma.location.create({
        data: { factoryId, code: `LOC-INV-A-${suffix}`, name: 'INV A', locationType: 'WAREHOUSE' },
      })
    ).id;
    locationB = (
      await prisma.location.create({
        data: { factoryId, code: `LOC-INV-B-${suffix}`, name: 'INV B', locationType: 'WAREHOUSE' },
      })
    ).id;
    needleTypeId = (
      await prisma.needleType.create({
        data: { code: `NT-INV-${suffix}`.toUpperCase(), name: 'INV needle', unit: 'PCS' },
      })
    ).id;

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );
    const clerkPermissions = await permissionFor([
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.STOCK_RECEIVE,
      PERMISSIONS.STOCK_RETURN,
      PERMISSIONS.STOCK_COUNT,
    ]);
    const viewerPermissions = await permissionFor([PERMISSIONS.STOCK_VIEW]);

    const clerkRole = await prisma.role.create({
      data: {
        code: clerkRoleCode,
        name: 'E2E inventory clerk',
        permissions: { create: clerkPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E inventory viewer',
        permissions: { create: viewerPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    for (const [username, roleId] of [
      [clerkUsername, clerkRole.id],
      [viewerUsername, viewerRole.id],
    ]) {
      await prisma.user.create({
        data: {
          username,
          name: username,
          passwordHash: await hash(password, 4),
          roles: { create: [{ roleId }] },
          factoryScopes: { create: [{ factoryId }] },
        },
      });
    }

    clerkToken = await login(clerkUsername);
    viewerToken = await login(viewerUsername);

    await receive(100).expect(201);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [clerkUsername, viewerUsername] } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
      await prisma.stockMovement.deleteMany({ where: { factoryId } });
      await prisma.inventoryBalance.deleteMany({ where: { factoryId } });
      await prisma.countSession.deleteMany({ where: { factoryId } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [clerkRoleCode, viewerRoleCode] } } });
      await prisma.location.deleteMany({ where: { factoryId } });
      await prisma.needleType.deleteMany({ where: { id: needleTypeId } });
      await prisma.factory.deleteMany({ where: { id: factoryId } });
    }
    await app?.close();
  });

  describe('Stock Return', () => {
    const body = () => ({
      factoryId,
      sourceLocationId: locationA,
      destinationLocationId: locationB,
      needleTypeId,
      quantity: 20,
      reason: 'Excess stock',
    });

    it('rejects a return without STOCK_RETURN', async () => {
      await post(viewerToken, '/inventory/returns', body()).expect(403);
    });

    it('rejects a return without a reason', async () => {
      const { reason: _omitted, ...withoutReason } = body();
      await post(clerkToken, '/inventory/returns', withoutReason).expect(400);
    });

    it('moves stock and writes a pair of RETURN movements sharing returnId', async () => {
      const response = await post(clerkToken, '/inventory/returns', body()).expect(201);

      const result = envelope<{
        returnId: string;
        sourceBalanceQuantity: number;
        destinationBalanceQuantity: number;
        reason: string;
      }>(response).data;
      expect(result).toEqual(
        expect.objectContaining({
          sourceBalanceQuantity: 80,
          destinationBalanceQuantity: 20,
          reason: 'Excess stock',
        }),
      );

      const movements = await prisma.stockMovement.findMany({
        where: { referenceId: result.returnId },
      });
      expect(movements).toHaveLength(2);
      expect(movements.every((row) => row.movementType === 'RETURN')).toBe(true);
    });

    it('rejects returning more than the source holds with 409', async () => {
      await post(clerkToken, '/inventory/returns', { ...body(), quantity: 1000 }).expect(409);
    });
  });

  describe('Physical Count', () => {
    let sessionId: string;

    it('rejects a session without STOCK_COUNT', async () => {
      await post(viewerToken, '/inventory/count-sessions', {
        factoryId,
        locationId: locationA,
      }).expect(403);
    });

    it('opens a session, counts a variance, and reconciles it on complete', async () => {
      const created = await post(clerkToken, '/inventory/count-sessions', {
        factoryId,
        locationId: locationA,
      }).expect(201);
      const session = envelope<CountDetail>(created).data;
      expect(session).toEqual(expect.objectContaining({ status: 'OPEN', items: [] }));
      sessionId = session.id;

      const counted = await post(clerkToken, `/inventory/count-sessions/${sessionId}/items`, {
        needleTypeId,
        physicalQuantity: 75,
      }).expect(200);
      expect(envelope<CountDetail>(counted).data.items).toEqual([
        { needleTypeId, systemQuantity: 80, physicalQuantity: 75, varianceQuantity: -5 },
      ]);

      const listed = await get(
        clerkToken,
        `/inventory/count-sessions?factoryId=${factoryId}`,
      ).expect(200);
      expect(envelope<{ id: string }[]>(listed).data.map((row) => row.id)).toContain(sessionId);

      const completed = await post(
        clerkToken,
        `/inventory/count-sessions/${sessionId}/complete`,
      ).expect(200);
      const result = envelope<{ session: CountDetail; adjustmentMovementIds: string[] }>(
        completed,
      ).data;
      expect(result.session.status).toBe('COMPLETED');
      expect(result.adjustmentMovementIds).toHaveLength(1);

      expect(await balanceAt(locationA)).toBe(75);
      const movement = await prisma.stockMovement.findUniqueOrThrow({
        where: { id: result.adjustmentMovementIds[0] },
      });
      expect(movement).toEqual(
        expect.objectContaining({
          movementType: 'ADJUSTMENT',
          referenceType: 'COUNT_SESSION',
          referenceId: sessionId,
        }),
      );
    });

    it('refuses to count into, or complete, a completed session', async () => {
      await post(clerkToken, `/inventory/count-sessions/${sessionId}/items`, {
        needleTypeId,
        physicalQuantity: 1,
      }).expect(409);
      await post(clerkToken, `/inventory/count-sessions/${sessionId}/complete`).expect(409);
    });

    it('refuses to reconcile a balance that moved since it was counted', async () => {
      const created = await post(clerkToken, '/inventory/count-sessions', {
        factoryId,
        locationId: locationA,
      }).expect(201);
      const staleId = envelope<CountDetail>(created).data.id;

      await post(clerkToken, `/inventory/count-sessions/${staleId}/items`, {
        needleTypeId,
        physicalQuantity: 70,
      }).expect(200);
      await receive(5).expect(201);

      await post(clerkToken, `/inventory/count-sessions/${staleId}/complete`).expect(409);

      expect(await balanceAt(locationA)).toBe(80);
      const detail = await get(clerkToken, `/inventory/count-sessions/${staleId}`).expect(200);
      expect(envelope<CountDetail>(detail).data.status).toBe('OPEN');
    });

    it('audits complete under ADJUST_STOCK against the session', async () => {
      const row = await prisma.auditLog.findFirst({
        where: { action: 'ADJUST_STOCK', entityType: 'CountSession', entityId: sessionId },
      });
      expect(row?.factoryId).toBe(factoryId);
    });
  });

  describe('inactive factory (FR-WEB-017)', () => {
    beforeAll(async () => {
      await prisma.factory.update({ where: { id: factoryId }, data: { status: 'INACTIVE' } });
    });

    afterAll(async () => {
      await prisma.factory.update({ where: { id: factoryId }, data: { status: 'ACTIVE' } });
    });

    it('rejects receiving, return and a new count session', async () => {
      await receive(1).expect(400);
      await post(clerkToken, '/inventory/returns', {
        factoryId,
        sourceLocationId: locationA,
        destinationLocationId: locationB,
        needleTypeId,
        quantity: 1,
        reason: 'x',
      }).expect(400);
      await post(clerkToken, '/inventory/count-sessions', {
        factoryId,
        locationId: locationA,
      }).expect(400);
    });
  });
});
