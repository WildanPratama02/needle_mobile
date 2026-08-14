import { INestApplication } from '@nestjs/common';
import { ConfirmationStatus, ExchangeState } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { ConfirmationService } from '../../src/modules/approval/services/confirmation.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

interface ConfirmationBody {
  id: string;
  confirmationNumber: string;
  status: ConfirmationStatus;
  exchangeId: string;
  exchangeStatus: ExchangeState;
  decisions: { decision: string; decidedBy: string; reason: string | null }[];
}

function bodyOf<T>(response: { body: unknown }): T {
  // Every response is wrapped in the Docs/12 §7 envelope; tests assert on the payload.
  return (response.body as { data: T }).data;
}

/**
 * Confirmation lifecycle over HTTP, plus the expiry sweep.
 *
 * Each test raises a fresh confirmation by driving a BROKEN exchange to
 * `/fragment` with NOT_FOUND, so the fixture matches what the API actually
 * produces rather than a hand-built row.
 */
describe('Confirmation lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let confirmations: ConfirmationService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_cnf_pic_${suffix}`;
  const approverUsername = `e2e_cnf_approver_${suffix}`;
  const outsiderUsername = `e2e_cnf_outsider_${suffix}`;
  const picRoleCode = `E2E_CNF_PIC_${suffix}`.toUpperCase();
  const approverRoleCode = `E2E_CNF_APPROVER_${suffix}`.toUpperCase();

  let picToken: string;
  let approverToken: string;
  let outsiderToken: string;
  let ids: {
    factoryId: string;
    trolleyId: string;
    deviceId: string;
    needleTypeId: string;
    brokenTypeId: string;
    rfidUid: string;
  };
  let sequence = 0;

  const server = () => app.getHttpServer() as Server;
  const as = (token: string) => (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  const login = async (username: string): Promise<string> => {
    const response = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);
    return bodyOf<{ accessToken: string }>(response).accessToken;
  };

  beforeAll(async () => {
    app = await createTestApp();

    prisma = app.get(PrismaService);
    confirmations = app.get(ConfirmationService);

    const trolley = await prisma.trolley.findFirstOrThrow();
    const device = await prisma.device.findFirstOrThrow();
    const needleType = await prisma.needleType.findFirstOrThrow();
    const broken = await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BROKEN' } });
    const card = await prisma.rfidCard.findFirstOrThrow();

    ids = {
      factoryId: trolley.factoryId,
      trolleyId: trolley.id,
      deviceId: device.id,
      needleTypeId: needleType.id,
      brokenTypeId: broken.id,
      rfidUid: card.rfidUid,
    };

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const picPermissions = await permissionFor([
      PERMISSIONS.EXCHANGE_VIEW,
      PERMISSIONS.EXCHANGE_CREATE,
      PERMISSIONS.CONFIRMATION_VIEW,
    ]);
    const approverPermissions = await permissionFor([
      PERMISSIONS.CONFIRMATION_VIEW,
      PERMISSIONS.CONFIRMATION_APPROVE,
      PERMISSIONS.CONFIRMATION_REJECT,
    ]);

    const picRole = await prisma.role.create({
      data: {
        code: picRoleCode,
        name: 'E2E confirmation PIC',
        permissions: { create: picPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const approverRole = await prisma.role.create({
      data: {
        code: approverRoleCode,
        name: 'E2E confirmation approver',
        permissions: { create: approverPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: picRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
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
    // Holds the permissions but is scoped to no factory — proves permission
    // alone is not enough (the 5-dimension rule).
    await prisma.user.create({
      data: {
        username: outsiderUsername,
        name: 'E2E Outsider',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: approverRole.id }] },
      },
    });

    picToken = await login(picUsername);
    approverToken = await login(approverUsername);
    outsiderToken = await login(outsiderUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [picUsername, approverUsername, outsiderUsername] } },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);
      const owned = await prisma.exchange.findMany({
        where: { picUserId: { in: userIds } },
        select: { id: true },
      });

      await prisma.confirmation.deleteMany({
        where: { exchangeId: { in: owned.map((row) => row.id) } },
      });
      await prisma.exchange.deleteMany({ where: { id: { in: owned.map((row) => row.id) } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [picRoleCode, approverRoleCode] } } });
    }
    await app?.close();
  });

  /** Drives a BROKEN exchange to NOT_FOUND, which raises the confirmation. */
  const raiseConfirmation = async (): Promise<{ confirmationId: string; exchangeId: string }> => {
    sequence += 1;
    const pic = as(picToken);

    const created = await pic(request(server()).post('/api/v1/exchanges'))
      .send({
        clientTransactionId: `cnf-${suffix}-${sequence}`,
        factoryId: ids.factoryId,
        trolleyId: ids.trolleyId,
        deviceId: ids.deviceId,
      })
      .expect(201);
    const exchangeId = bodyOf<{ id: string }>(created).id;

    await pic(request(server()).post(`/api/v1/exchanges/${exchangeId}/operator`))
      .send({ rfidUid: ids.rfidUid })
      .expect(200);
    await pic(request(server()).post(`/api/v1/exchanges/${exchangeId}/type`))
      .send({ exchangeTypeId: ids.brokenTypeId, oldNeedleTypeId: ids.needleTypeId })
      .expect(200);
    const fragment = await pic(request(server()).post(`/api/v1/exchanges/${exchangeId}/fragment`))
      .send({ fragmentStatus: 'NOT_FOUND' })
      .expect(200);

    return {
      confirmationId: bodyOf<{ confirmationId: string }>(fragment).confirmationId,
      exchangeId,
    };
  };

  describe('approval', () => {
    it('approves a pending confirmation and records the decision', async () => {
      const { confirmationId, exchangeId } = await raiseConfirmation();

      const response = await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({ reason: 'Supervisor confirmed the fragment is unavailable.' })
        .expect(200);

      const body = bodyOf<ConfirmationBody>(response);
      expect(body.status).toBe(ConfirmationStatus.APPROVED);
      expect(body.decisions).toHaveLength(1);
      expect(body.decisions[0].decision).toBe('APPROVED');

      // Approving releases the exchange but does not itself move it —
      // EVIDENCE_CAPTURED comes from issue 07's upload.
      expect(body.exchangeStatus).toBe(ExchangeState.CONFIRMATION_PENDING);
      const exchange = await prisma.exchange.findUniqueOrThrow({ where: { id: exchangeId } });
      expect(exchange.state).toBe(ExchangeState.CONFIRMATION_PENDING);
    });

    it('accepts an approval with no reason', async () => {
      const { confirmationId } = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({})
        .expect(200);
    });

    it('refuses a second decision on the same confirmation', async () => {
      const { confirmationId } = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({})
        .expect(200);

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({ reason: 'Changed my mind' })
        .expect(409);
    });
  });

  describe('rejection', () => {
    it('records a rejection and leaves the exchange stuck at CONFIRMATION_PENDING', async () => {
      const { confirmationId, exchangeId } = await raiseConfirmation();

      const response = await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({ reason: 'Fragment must be located before the exchange can continue.' })
        .expect(200);

      expect(bodyOf<ConfirmationBody>(response).status).toBe(ConfirmationStatus.REJECTED);

      // No forward transition, and no BLOCKED state — it simply stops.
      const exchange = await prisma.exchange.findUniqueOrThrow({ where: { id: exchangeId } });
      expect(exchange.state).toBe(ExchangeState.CONFIRMATION_PENDING);
      expect(exchange.cancelledAt).toBeNull();
    });

    it('rejects a rejection with no reason', async () => {
      const { confirmationId } = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({})
        .expect(400);
    });

    it('rejects a blank reason', async () => {
      const { confirmationId } = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({ reason: '   ' })
        .expect(400);
    });
  });

  describe('expiry', () => {
    it('expires an overdue pending confirmation', async () => {
      const { confirmationId } = await raiseConfirmation();

      await prisma.confirmation.update({
        where: { id: confirmationId },
        data: { dueAt: new Date(Date.now() - 1000) },
      });

      await confirmations.expireOverdue();

      const expired = await prisma.confirmation.findUniqueOrThrow({
        where: { id: confirmationId },
      });
      expect(expired.status).toBe(ConfirmationStatus.EXPIRED);
      expect(await prisma.confirmationDecision.count({ where: { confirmationId } })).toBe(0);
    });

    it('leaves a confirmation that is not yet due alone', async () => {
      const { confirmationId } = await raiseConfirmation();

      await confirmations.expireOverdue();

      const untouched = await prisma.confirmation.findUniqueOrThrow({
        where: { id: confirmationId },
      });
      expect(untouched.status).toBe(ConfirmationStatus.PENDING);
    });

    it('refuses to decide an expired confirmation', async () => {
      const { confirmationId } = await raiseConfirmation();

      await prisma.confirmation.update({
        where: { id: confirmationId },
        data: { dueAt: new Date(Date.now() - 1000) },
      });
      await confirmations.expireOverdue();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({})
        .expect(409);
    });
  });

  describe('authorization', () => {
    // Holding the permission is not enough — the factory dimension is checked
    // separately, and failing it is 403 like any other authorization refusal.
    it('refuses with 403 an approver holding the permission but scoped to no factory', async () => {
      const { confirmationId } = await raiseConfirmation();

      const response = await as(outsiderToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({})
        .expect(403);

      expect((response.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('refuses a PIC without CONFIRMATION_APPROVE', async () => {
      const { confirmationId } = await raiseConfirmation();

      await as(picToken)(request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`))
        .send({})
        .expect(403);
    });

    it('refuses an unauthenticated request', async () => {
      await request(server()).get('/api/v1/confirmations').expect(401);
    });
  });

  describe('reads', () => {
    it('lists confirmations in the caller factory scope', async () => {
      await raiseConfirmation();

      const response = await as(approverToken)(
        request(server()).get('/api/v1/confirmations?status=PENDING'),
      ).expect(200);

      // Paginated envelope (Docs/12 §7): rows in `data`, counters in `meta`.
      const items = bodyOf<ConfirmationBody[]>(response);
      const meta = (response.body as { meta: { total: number } }).meta;

      expect(meta.total).toBeGreaterThan(0);
      expect(items.every((item) => item.status === ConfirmationStatus.PENDING)).toBe(true);
    });

    it('returns one confirmation with its decision history', async () => {
      const { confirmationId } = await raiseConfirmation();
      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({ reason: 'ok' })
        .expect(200);

      const response = await as(approverToken)(
        request(server()).get(`/api/v1/confirmations/${confirmationId}`),
      ).expect(200);

      const body = bodyOf<ConfirmationBody>(response);
      expect(body.confirmationNumber).toMatch(/^CNF-\d{8}-\d{6}$/);
      expect(body.decisions[0].reason).toBe('ok');
    });

    it('404s an unknown confirmation', async () => {
      await as(approverToken)(
        request(server()).get('/api/v1/confirmations/00000000-0000-0000-0000-000000000000'),
      ).expect(404);
    });
  });
});
