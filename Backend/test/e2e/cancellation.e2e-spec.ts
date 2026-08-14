import { INestApplication } from '@nestjs/common';
import { ExchangeState, MovementType } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

interface ExchangeBody {
  id: string;
  status: ExchangeState;
  cancelledAt: string | null;
}

function bodyOf<T>(response: { body: unknown }): T {
  // Every response is wrapped in the Docs/12 §7 envelope; tests assert on the payload.
  return (response.body as { data: T }).data;
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Cancellation and stock reversal (issue 09).
 *
 * The reversal semantics come straight from Docs/02 §22-23: after
 * `NEEDLE_ISSUED` an exchange is not deleted, it is voided with a reversing
 * movement — `Trolley -1` on issue becomes `Trolley +1` on reversal, and the
 * original ISSUE row survives.
 */
describe('Cancellation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_cancel_pic_${suffix}`;
  const approverUsername = `e2e_cancel_approver_${suffix}`;
  const roleCode = `E2E_CANCEL_PIC_${suffix}`.toUpperCase();

  let token: string;
  let ids: {
    factoryId: string;
    trolleyId: string;
    trolleyLocationId: string;
    deviceId: string;
    needleTypeId: string;
    bentTypeId: string;
    brokenTypeId: string;
    rfidUid: string;
  };
  let sequence = 0;

  const server = () => app.getHttpServer() as Server;
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = await createTestApp();

    prisma = app.get(PrismaService);

    const trolley = await prisma.trolley.findFirstOrThrow();
    const device = await prisma.device.findFirstOrThrow();
    const needleType = await prisma.needleType.findFirstOrThrow();
    const bent = await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BENT' } });
    const broken = await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BROKEN' } });
    const card = await prisma.rfidCard.findFirstOrThrow();

    ids = {
      factoryId: trolley.factoryId,
      trolleyId: trolley.id,
      trolleyLocationId: trolley.locationId,
      deviceId: device.id,
      needleTypeId: needleType.id,
      bentTypeId: bent.id,
      brokenTypeId: broken.id,
      rfidUid: card.rfidUid,
    };

    const permissions = await Promise.all(
      [
        PERMISSIONS.EXCHANGE_VIEW,
        PERMISSIONS.EXCHANGE_CREATE,
        PERMISSIONS.EXCHANGE_ISSUE,
        PERMISSIONS.EXCHANGE_COMPLETE,
        PERMISSIONS.EXCHANGE_CANCEL,
      ].map((code) =>
        prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
      ),
    );

    const role = await prisma.role.create({
      data: {
        code: roleCode,
        name: 'E2E cancel PIC',
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E Cancel PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: role.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });

    const approverRole = await prisma.role.upsert({
      where: { code: 'APPROVER' },
      update: {},
      create: { code: 'APPROVER', name: 'Approver' },
    });
    await prisma.user.create({
      data: {
        username: approverUsername,
        name: 'E2E Cancel Approver',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: approverRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });

    const login = await request(server())
      .post('/api/v1/auth/login')
      .send({ username: picUsername, password })
      .expect(200);
    token = bodyOf<{ accessToken: string }>(login).accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [picUsername, approverUsername] } },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);
      const owned = await prisma.exchange.findMany({
        where: { picUserId: { in: userIds } },
        select: { id: true },
      });
      const ownedIds = owned.map((row) => row.id);

      await prisma.stockMovement.deleteMany({ where: { referenceId: { in: ownedIds } } });
      await prisma.exchangeEvidence.deleteMany({ where: { exchangeId: { in: ownedIds } } });
      await prisma.confirmation.deleteMany({ where: { exchangeId: { in: ownedIds } } });
      await prisma.exchange.deleteMany({ where: { id: { in: ownedIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: roleCode } });
    }
    await app?.close();
  });

  const trolleyBalance = async (): Promise<number> => {
    const balance = await prisma.inventoryBalance.findUniqueOrThrow({
      where: {
        locationId_needleTypeId: {
          locationId: ids.trolleyLocationId,
          needleTypeId: ids.needleTypeId,
        },
      },
    });
    return balance.quantity.toNumber();
  };

  /** Drives an exchange as far along the flow as requested. */
  const exchangeAt = async (stopAfter: 'create' | 'type' | 'evidence' | 'issue' | 'stored') => {
    sequence += 1;

    const created = await auth(request(server()).post('/api/v1/exchanges'))
      .send({
        clientTransactionId: `cancel-${suffix}-${sequence}`,
        factoryId: ids.factoryId,
        trolleyId: ids.trolleyId,
        deviceId: ids.deviceId,
      })
      .expect(201);
    const id = bodyOf<ExchangeBody>(created).id;
    if (stopAfter === 'create') return id;

    await auth(request(server()).post(`/api/v1/exchanges/${id}/operator`))
      .send({ rfidUid: ids.rfidUid })
      .expect(200);
    await auth(request(server()).post(`/api/v1/exchanges/${id}/type`))
      .send({ exchangeTypeId: ids.bentTypeId, oldNeedleTypeId: ids.needleTypeId })
      .expect(200);
    if (stopAfter === 'type') return id;

    await auth(request(server()).post(`/api/v1/exchanges/${id}/evidence`))
      .field('evidenceType', 'OLD_NEEDLE')
      .attach('file', PNG, { filename: 'old.png', contentType: 'image/png' })
      .expect(201);
    if (stopAfter === 'evidence') return id;

    await auth(request(server()).post(`/api/v1/exchanges/${id}/new-needle`))
      .send({ needleTypeId: ids.needleTypeId })
      .expect(200);
    await auth(request(server()).post(`/api/v1/exchanges/${id}/issue`))
      .send({ quantity: 1 })
      .expect(200);
    if (stopAfter === 'issue') return id;

    await auth(request(server()).post(`/api/v1/exchanges/${id}/store-used-needle`)).expect(200);
    return id;
  };

  const cancel = (id: string, reason = 'Operator cancelled transaction') =>
    auth(request(server()).post(`/api/v1/exchanges/${id}/cancel`)).send({ reason });

  describe('before stock issue — no stock touched', () => {
    it.each(['create', 'type', 'evidence'] as const)('cancels from the %s stage', async (stage) => {
      const id = await exchangeAt(stage);
      const before = await trolleyBalance();

      const response = await cancel(id).expect(200);
      const body = bodyOf<ExchangeBody>(response);

      expect(body.status).toBe(ExchangeState.CANCELLED);
      expect(body.cancelledAt).not.toBeNull();
      expect(await trolleyBalance()).toBe(before);
      expect(await prisma.stockMovement.count({ where: { referenceId: id } })).toBe(0);
    });

    it('records the cancellation reason', async () => {
      const id = await exchangeAt('create');

      await cancel(id, 'Operator left the line').expect(200);

      const exchange = await prisma.exchange.findUniqueOrThrow({ where: { id } });
      expect(exchange.cancellationReason).toBe('Operator left the line');
    });
  });

  describe('after stock issue — reversal', () => {
    it('returns the issued needle to the trolley and keeps the original movement', async () => {
      const before = await trolleyBalance();
      const id = await exchangeAt('issue');

      expect(await trolleyBalance()).toBe(before - 1);

      await cancel(id, 'Wrong needle issued').expect(200);

      // Trolley -1 on issue, Trolley +1 on reversal (Docs/02 §23).
      expect(await trolleyBalance()).toBe(before);

      const movements = await prisma.stockMovement.findMany({
        where: { referenceId: id },
        orderBy: { createdAt: 'asc' },
      });

      expect(movements.map((m) => m.movementType)).toEqual([
        MovementType.ISSUE,
        MovementType.REVERSAL,
      ]);

      const reversal = movements[1];
      expect(reversal.quantity.toNumber()).toBe(1);
      // Stock coming back in: the trolley is the destination, mirroring the issue.
      expect(reversal.destinationLocationId).toBe(ids.trolleyLocationId);
      expect(reversal.sourceLocationId).toBeNull();
      expect(reversal.reason).toBe('Wrong needle issued');
      expect(reversal.movementNumber).toMatch(/^MV-\d{8}-\d{6}$/);
    });

    it('reverses just as well from USED_NEEDLE_STORED', async () => {
      const before = await trolleyBalance();
      const id = await exchangeAt('stored');

      await cancel(id).expect(200);

      expect(await trolleyBalance()).toBe(before);
      expect(
        await prisma.stockMovement.count({
          where: { referenceId: id, movementType: MovementType.REVERSAL },
        }),
      ).toBe(1);
    });

    it('does not double-credit when a cancel is replayed', async () => {
      const before = await trolleyBalance();
      const id = await exchangeAt('issue');

      await cancel(id).expect(200);
      // A second attempt is refused by the terminal-state check, so the
      // balance cannot drift even if a client retries after a timeout.
      await cancel(id).expect(409);

      expect(await trolleyBalance()).toBe(before);
      expect(
        await prisma.stockMovement.count({
          where: { referenceId: id, movementType: MovementType.REVERSAL },
        }),
      ).toBe(1);
    });
  });

  describe('stuck exchanges', () => {
    // Cancelling is how a rejected confirmation gets released (CONTEXT.md).
    it('cancels an exchange whose confirmation was rejected', async () => {
      sequence += 1;
      const created = await auth(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `cancel-stuck-${suffix}-${sequence}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(201);
      const id = bodyOf<ExchangeBody>(created).id;

      await auth(request(server()).post(`/api/v1/exchanges/${id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${id}/type`))
        .send({ exchangeTypeId: ids.brokenTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${id}/fragment`))
        .send({ fragmentStatus: 'NOT_FOUND' })
        .expect(200);

      const confirmation = await prisma.confirmation.findUniqueOrThrow({
        where: { exchangeId: id },
      });
      await prisma.confirmation.update({
        where: { id: confirmation.id },
        data: { status: 'REJECTED', decidedAt: new Date() },
      });

      const response = await cancel(id, 'Rejected by approver').expect(200);

      expect(bodyOf<ExchangeBody>(response).status).toBe(ExchangeState.CANCELLED);
    });
  });

  describe('rules', () => {
    it('refuses to cancel a COMPLETED exchange', async () => {
      const id = await exchangeAt('stored');
      await auth(request(server()).post(`/api/v1/exchanges/${id}/complete`)).expect(200);

      await cancel(id).expect(409);
    });

    it('refuses to advance a cancelled exchange', async () => {
      const id = await exchangeAt('type');
      await cancel(id).expect(200);

      await auth(request(server()).post(`/api/v1/exchanges/${id}/new-needle`))
        .send({ needleTypeId: ids.needleTypeId })
        .expect(409);
    });

    it('requires a reason', async () => {
      const id = await exchangeAt('create');

      await auth(request(server()).post(`/api/v1/exchanges/${id}/cancel`))
        .send({})
        .expect(400);
    });

    it('rejects a blank reason', async () => {
      const id = await exchangeAt('create');

      await auth(request(server()).post(`/api/v1/exchanges/${id}/cancel`))
        .send({ reason: '   ' })
        .expect(400);
    });

    it('404s an unknown exchange', async () => {
      await cancel('00000000-0000-0000-0000-000000000000').expect(404);
    });

    it('rejects an unauthenticated request', async () => {
      const id = await exchangeAt('create');

      await request(server())
        .post(`/api/v1/exchanges/${id}/cancel`)
        .send({ reason: 'nope' })
        .expect(401);
    });
  });
});
