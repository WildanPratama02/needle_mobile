import { INestApplication } from '@nestjs/common';
import { ConfirmationStatus, ExchangeState, LocationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

interface ExchangeBody {
  id: string;
  exchangeNumber: string;
  status: ExchangeState;
  operatorId: string | null;
  exchangeTypeId: string | null;
  newNeedleTypeId: string | null;
  fragmentStatus: string | null;
  confirmationId: string | null;
}

function bodyOf<T>(response: { body: unknown }): T {
  // Every response is wrapped in the Docs/12 §7 envelope; tests assert on the payload.
  return (response.body as { data: T }).data;
}

/**
 * Drives the exchange state machine over HTTP against the real database and,
 * since issue 07, real MinIO. Every transition goes through the API — nothing
 * is written directly through Prisma to move the flow along.
 */
describe('Exchange flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_flow_pic_${suffix}`;
  const approverUsername = `e2e_flow_approver_${suffix}`;
  const picRoleCode = `E2E_FLOW_PIC_${suffix}`.toUpperCase();

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
  const createdExchangeIds: string[] = [];
  let sequence = 0;

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

    // PIC with every exchange permission, scoped to the seeded factory.
    const permissions = await Promise.all(
      [
        PERMISSIONS.EXCHANGE_VIEW,
        PERMISSIONS.EXCHANGE_CREATE,
        PERMISSIONS.EXCHANGE_ISSUE,
        PERMISSIONS.EXCHANGE_COMPLETE,
      ].map((code) =>
        prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
      ),
    );

    const role = await prisma.role.create({
      data: {
        code: picRoleCode,
        name: 'E2E flow PIC',
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E Flow PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: role.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });

    // An APPROVER must exist and be factory-scoped, or /fragment NOT_FOUND
    // cannot raise a confirmation (round 4 Q11).
    const approverRole = await prisma.role.upsert({
      where: { code: 'APPROVER' },
      update: {},
      create: { code: 'APPROVER', name: 'Approver' },
    });
    await prisma.user.create({
      data: {
        username: approverUsername,
        name: 'E2E Approver',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: approverRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });

    const login = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({ username: picUsername, password })
      .expect(200);

    token = bodyOf<{ accessToken: string }>(login).accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      // Delete by owner rather than by the tracked id list: some tests create
      // exchanges through idempotency replays that never return a new id.
      const pic = await prisma.user.findUnique({ where: { username: picUsername } });

      if (pic) {
        const owned = await prisma.exchange.findMany({
          where: { picUserId: pic.id },
          select: { id: true },
        });
        const ownedIds = owned.map((row) => row.id);

        await prisma.stockMovement.deleteMany({ where: { referenceId: { in: ownedIds } } });
        await prisma.exchange.deleteMany({ where: { id: { in: ownedIds } } });
      }

      await prisma.user.deleteMany({
        where: { username: { in: [picUsername, approverUsername] } },
      });
      await prisma.role.deleteMany({ where: { code: picRoleCode } });
      await prisma.idempotencyKey.deleteMany({ where: { idempotencyKey: `idem-${suffix}` } });
    }
    await app?.close();
  });

  const server = () => app.getHttpServer() as Server;
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  const createExchange = async (): Promise<ExchangeBody> => {
    sequence += 1;
    const response = await auth(request(server()).post('/api/v1/exchanges'))
      .send({
        clientTransactionId: `flow-${suffix}-${sequence}`,
        factoryId: ids.factoryId,
        trolleyId: ids.trolleyId,
        deviceId: ids.deviceId,
      })
      .expect(201);

    const body = bodyOf<ExchangeBody>(response);
    createdExchangeIds.push(body.id);
    return body;
  };

  /** Smallest valid PNG — the evidence endpoint stores it in MinIO for real. */
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  /**
   * Uploads the one mandatory photo, which advances the exchange to
   * EVIDENCE_CAPTURED. These are BENT exchanges, so OLD_NEEDLE is the whole
   * required set (round 4 Q9).
   */
  const captureEvidence = (id: string) =>
    auth(request(server()).post(`/api/v1/exchanges/${id}/evidence`))
      .field('evidenceType', 'OLD_NEEDLE')
      .attach('file', PNG, { filename: 'old-needle.png', contentType: 'image/png' })
      .expect(201);

  describe('happy path — BENT exchange', () => {
    it('runs CREATED through COMPLETED', async () => {
      const created = await createExchange();
      expect(created.status).toBe(ExchangeState.CREATED);
      expect(created.exchangeNumber).toMatch(/^EXC-\d{8}-\d{6}$/);

      const operator = await auth(
        request(server()).post(`/api/v1/exchanges/${created.id}/operator`),
      )
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      expect(bodyOf<ExchangeBody>(operator).status).toBe(ExchangeState.OPERATOR_IDENTIFIED);
      expect(bodyOf<ExchangeBody>(operator).operatorId).not.toBeNull();

      const typed = await auth(request(server()).post(`/api/v1/exchanges/${created.id}/type`))
        .send({ exchangeTypeId: ids.bentTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);
      expect(bodyOf<ExchangeBody>(typed).status).toBe(ExchangeState.EXCHANGE_TYPE_SELECTED);

      await captureEvidence(created.id);

      const newNeedle = await auth(
        request(server()).post(`/api/v1/exchanges/${created.id}/new-needle`),
      )
        .send({ needleTypeId: ids.needleTypeId })
        .expect(200);
      expect(bodyOf<ExchangeBody>(newNeedle).status).toBe(ExchangeState.NEW_NEEDLE_SELECTED);

      const before = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });

      const issued = await auth(request(server()).post(`/api/v1/exchanges/${created.id}/issue`))
        .send({ quantity: 1 })
        .expect(200);
      expect(bodyOf<ExchangeBody>(issued).status).toBe(ExchangeState.NEEDLE_ISSUED);

      // The decrement and the ledger entry must both have happened.
      const after = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });
      expect(after.quantity.toNumber()).toBe(before.quantity.toNumber() - 1);

      const movements = await prisma.stockMovement.findMany({
        where: { referenceType: 'EXCHANGE', referenceId: created.id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].movementType).toBe('ISSUE');
      expect(movements[0].quantity.toNumber()).toBe(1);
      expect(movements[0].sourceLocationId).toBe(ids.trolleyLocationId);

      const stored = await auth(
        request(server()).post(`/api/v1/exchanges/${created.id}/store-used-needle`),
      ).expect(200);
      expect(bodyOf<ExchangeBody>(stored).status).toBe(ExchangeState.USED_NEEDLE_STORED);

      const completed = await auth(
        request(server()).post(`/api/v1/exchanges/${created.id}/complete`),
      ).expect(200);
      expect(bodyOf<ExchangeBody>(completed).status).toBe(ExchangeState.COMPLETED);
    });

    it('refuses any further transition once COMPLETED', async () => {
      const completed = await prisma.exchange.findFirstOrThrow({
        where: { id: { in: createdExchangeIds }, state: ExchangeState.COMPLETED },
      });

      await auth(request(server()).post(`/api/v1/exchanges/${completed.id}/complete`)).expect(409);
    });
  });

  describe('BROKEN with a missing fragment', () => {
    it('raises a confirmation and blocks evidence until approved', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/type`))
        .send({ exchangeTypeId: ids.brokenTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);

      const fragment = await auth(
        request(server()).post(`/api/v1/exchanges/${exchange.id}/fragment`),
      )
        .send({ fragmentStatus: 'NOT_FOUND' })
        .expect(200);

      const body = bodyOf<ExchangeBody>(fragment);
      expect(body.status).toBe(ExchangeState.CONFIRMATION_PENDING);
      expect(body.confirmationId).not.toBeNull();

      const confirmation = await prisma.confirmation.findUniqueOrThrow({
        where: { exchangeId: exchange.id },
      });
      expect(confirmation.status).toBe(ConfirmationStatus.PENDING);
      expect(confirmation.confirmationNumber).toMatch(/^CNF-\d{8}-\d{6}$/);
      expect(confirmation.dueAt).not.toBeNull();

      // Still blocked: the exchange stops advancing rather than entering a
      // "BLOCKED" state (CONTEXT.md).
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/new-needle`))
        .send({ needleTypeId: ids.needleTypeId })
        .expect(409);
    });

    it('stops at FRAGMENT_CHECK when the fragment was found', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/type`))
        .send({ exchangeTypeId: ids.brokenTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);

      const fragment = await auth(
        request(server()).post(`/api/v1/exchanges/${exchange.id}/fragment`),
      )
        .send({ fragmentStatus: 'FOUND' })
        .expect(200);

      expect(bodyOf<ExchangeBody>(fragment).status).toBe(ExchangeState.FRAGMENT_CHECK);
      expect(bodyOf<ExchangeBody>(fragment).confirmationId).toBeNull();
    });

    it('rejects NOT_REQUIRED, which is no longer a fragment status', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/type`))
        .send({ exchangeTypeId: ids.brokenTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/fragment`))
        .send({ fragmentStatus: 'NOT_REQUIRED' })
        .expect(400);
    });

    it('refuses a fragment check on a BENT exchange', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/type`))
        .send({ exchangeTypeId: ids.bentTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/fragment`))
        .send({ fragmentStatus: 'FOUND' })
        .expect(409);
    });
  });

  describe('state machine enforcement over HTTP', () => {
    it('refuses to skip straight to issue', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/issue`))
        .send({ quantity: 1 })
        .expect(409);
    });

    it('refuses to select a type before the operator is identified', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/type`))
        .send({ exchangeTypeId: ids.bentTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(409);
    });

    it('404s an unknown exchange', async () => {
      await auth(
        request(server()).post('/api/v1/exchanges/00000000-0000-0000-0000-000000000000/complete'),
      ).expect(404);
    });
  });

  describe('stock safety', () => {
    it('refuses to issue more than the trolley holds', async () => {
      const exchange = await createExchange();

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/type`))
        .send({ exchangeTypeId: ids.bentTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);
      await captureEvidence(exchange.id);
      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/new-needle`))
        .send({ needleTypeId: ids.needleTypeId })
        .expect(200);

      const balance = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });

      await auth(request(server()).post(`/api/v1/exchanges/${exchange.id}/issue`))
        .send({ quantity: balance.quantity.toNumber() + 1 })
        .expect(409);

      // Nothing moved: no partial decrement, no orphan ledger row.
      const after = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });
      expect(after.quantity.toNumber()).toBe(balance.quantity.toNumber());
      expect(await prisma.stockMovement.count({ where: { referenceId: exchange.id } })).toBe(0);
    });
  });

  describe('idempotency', () => {
    it('returns the original exchange when the same command is replayed', async () => {
      const clientTransactionId = `replay-${suffix}`;
      const payload = {
        clientTransactionId,
        factoryId: ids.factoryId,
        trolleyId: ids.trolleyId,
        deviceId: ids.deviceId,
      };

      const first = await auth(request(server()).post('/api/v1/exchanges'))
        .send(payload)
        .expect(201);
      const firstBody = bodyOf<ExchangeBody>(first);
      createdExchangeIds.push(firstBody.id);

      const replay = await auth(request(server()).post('/api/v1/exchanges'))
        .send(payload)
        .expect(201);

      expect(bodyOf<ExchangeBody>(replay).id).toBe(firstBody.id);
      expect(bodyOf<ExchangeBody>(replay).exchangeNumber).toBe(firstBody.exchangeNumber);
    });

    it('rejects a reused Idempotency-Key carrying a different body', async () => {
      const key = `idem-${suffix}`;

      await auth(request(server()).post('/api/v1/exchanges'))
        .set('Idempotency-Key', key)
        .send({
          clientTransactionId: `idem-a-${suffix}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(201);

      await auth(request(server()).post('/api/v1/exchanges'))
        .set('Idempotency-Key', key)
        .send({
          clientTransactionId: `idem-b-${suffix}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(422);
    });
  });

  describe('authorization', () => {
    it('rejects an unauthenticated request', async () => {
      await request(server()).get('/api/v1/exchanges').expect(401);
    });

    // The positive half of the pair below: the shared factory-scope helper
    // must let a properly scoped caller through on both a write and a read.
    it('accepts a factory the caller is scoped to', async () => {
      sequence += 1;

      const created = await auth(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `in-scope-${suffix}-${sequence}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(201);

      const body = bodyOf<ExchangeBody>(created);
      createdExchangeIds.push(body.id);
      expect(body.status).toBe(ExchangeState.CREATED);

      // Reading it back exercises the same helper on a load-then-check path.
      const fetched = await auth(request(server()).get(`/api/v1/exchanges/${body.id}`)).expect(200);
      expect(bodyOf<ExchangeBody>(fetched).id).toBe(body.id);

      // And a transition, which checks scope against the loaded exchange
      // rather than against the request body.
      await auth(request(server()).post(`/api/v1/exchanges/${body.id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
    });

    // 403, not 400: the request is well-formed, the caller simply may not act
    // in that factory. Matches ScopeGuard, which has always returned 403.
    it('rejects a factory the caller is not scoped to with 403', async () => {
      const otherFactory = await prisma.factory.create({
        data: { code: `FAC-${suffix}`, name: 'Other factory', timezone: 'Asia/Jakarta' },
      });

      const response = await auth(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `scope-${suffix}`,
          factoryId: otherFactory.id,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(403);

      expect((response.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');

      await prisma.factory.delete({ where: { id: otherFactory.id } });
    });

    // Regression for the test/production drift found in issue 11: these suites
    // used to build a ValidationPipe without `enableImplicitConversion`, so a
    // numeric query parameter arrived as a string and 400'd here while
    // succeeding in production. Both now share `configureApp`.
    it('coerces numeric query parameters the way production does', async () => {
      const response = await auth(
        request(server()).get('/api/v1/exchanges?page=1&pageSize=5'),
      ).expect(200);

      const meta = (response.body as { meta: { page: number; pageSize: number } }).meta;
      expect(meta.page).toBe(1);
      expect(meta.pageSize).toBe(5);
    });

    it('lists only exchanges inside the caller factory scope', async () => {
      const response = await auth(request(server()).get('/api/v1/exchanges')).expect(200);

      // Paginated envelope (Docs/12 §7): rows in `data`, counters in `meta`.
      const items = bodyOf<{ id: string }[]>(response);
      const meta = (response.body as { meta: { total: number; totalPages: number } }).meta;

      expect(meta.total).toBeGreaterThan(0);
      expect(meta.totalPages).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(items)).toBe(true);

      const factoryIds = await prisma.exchange.findMany({
        where: { id: { in: items.map((item) => item.id) } },
        select: { factoryId: true },
      });
      expect(factoryIds.every((row) => row.factoryId === ids.factoryId)).toBe(true);
    });
  });

  describe('seeded storage mapping', () => {
    it('resolves the used-needle destination from trolley plus exchange type', async () => {
      const mapping = await prisma.storageMapping.findFirstOrThrow({
        where: { trolleyId: ids.trolleyId, exchangeTypeId: ids.bentTypeId },
        include: { storageLocation: true },
      });

      expect(mapping.storageLocation.locationType).toBe(LocationType.USED_NEEDLE_STORAGE);
    });
  });
});
