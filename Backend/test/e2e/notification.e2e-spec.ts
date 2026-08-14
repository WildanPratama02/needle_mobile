import { INestApplication } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

function bodyOf<T>(response: { body: unknown }): T {
  // Every response is wrapped in the Docs/12 §7 envelope; tests assert on the payload.
  return (response.body as { data: T }).data;
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Notification records produced by the three triggers in issue 08.
 *
 * Assertions are on the persisted `notifications` rows, not on WhatsApp: the
 * provider is not reachable in dev and dispatch is asynchronous, so status is
 * deliberately not asserted. What matters here is that the right notice is
 * recorded for the right recipient, exactly once.
 */
describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_notif_pic_${suffix}`;
  const approverUsername = `e2e_notif_approver_${suffix}`;
  const picRoleCode = `E2E_NOTIF_PIC_${suffix}`.toUpperCase();
  const approverRoleCode = `E2E_NOTIF_APR_${suffix}`.toUpperCase();

  let picToken: string;
  let approverToken: string;
  let picUserId: string;
  let approverUserId: string;
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

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const picPermissions = await permissionFor([
      PERMISSIONS.EXCHANGE_VIEW,
      PERMISSIONS.EXCHANGE_CREATE,
      PERMISSIONS.EXCHANGE_ISSUE,
    ]);
    const approverPermissions = await permissionFor([
      PERMISSIONS.CONFIRMATION_VIEW,
      PERMISSIONS.CONFIRMATION_APPROVE,
      PERMISSIONS.CONFIRMATION_REJECT,
    ]);

    const picRole = await prisma.role.create({
      data: {
        code: picRoleCode,
        name: 'E2E notif PIC',
        permissions: { create: picPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const approverRole = await prisma.role.create({
      data: {
        code: approverRoleCode,
        name: 'E2E notif approver',
        permissions: { create: approverPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    const pic = await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E Notif PIC',
        passwordHash: await hash(password, 4),
        phoneNumber: '+620000000101',
        roles: { create: [{ roleId: picRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });
    picUserId = pic.id;

    // The APPROVER role is what /fragment uses to resolve a recipient, so this
    // user needs it in addition to the permission-bearing test role.
    const baseApproverRole = await prisma.role.upsert({
      where: { code: 'APPROVER' },
      update: {},
      create: { code: 'APPROVER', name: 'Approver' },
    });
    const approver = await prisma.user.create({
      data: {
        username: approverUsername,
        name: 'E2E Notif Approver',
        passwordHash: await hash(password, 4),
        phoneNumber: '+620000000102',
        roles: { create: [{ roleId: approverRole.id }, { roleId: baseApproverRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });
    approverUserId = approver.id;

    picToken = await login(picUsername);
    approverToken = await login(approverUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const userIds = [picUserId, approverUserId].filter(Boolean);
      const owned = await prisma.exchange.findMany({
        where: { picUserId: { in: userIds } },
        select: { id: true },
      });
      const ownedIds = owned.map((row) => row.id);

      await prisma.notification.deleteMany({ where: { exchangeId: { in: ownedIds } } });
      await prisma.stockMovement.deleteMany({ where: { referenceId: { in: ownedIds } } });
      await prisma.exchangeEvidence.deleteMany({ where: { exchangeId: { in: ownedIds } } });
      await prisma.confirmation.deleteMany({ where: { exchangeId: { in: ownedIds } } });
      await prisma.exchange.deleteMany({ where: { id: { in: ownedIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [picRoleCode, approverRoleCode] } } });
    }
    await app?.close();
  });

  const notificationsFor = (exchangeId: string, type?: NotificationType) =>
    prisma.notification.findMany({
      where: { exchangeId, notificationType: type },
      orderBy: { createdAt: 'asc' },
    });

  /** BROKEN + NOT_FOUND: raises the confirmation and its notification. */
  const raiseConfirmation = async () => {
    sequence += 1;
    const pic = as(picToken);

    const created = await pic(request(server()).post('/api/v1/exchanges'))
      .send({
        clientTransactionId: `notif-${suffix}-${sequence}`,
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
      exchangeId,
      confirmationId: bodyOf<{ confirmationId: string }>(fragment).confirmationId,
    };
  };

  describe('confirmation requested', () => {
    it('notifies the assigned approver when a fragment goes missing', async () => {
      const { exchangeId, confirmationId } = await raiseConfirmation();

      const rows = await notificationsFor(exchangeId, NotificationType.CONFIRMATION_REQUESTED);

      expect(rows).toHaveLength(1);
      expect(rows[0].confirmationId).toBe(confirmationId);
      expect(rows[0].templateCode).toBe('BROKEN_NEEDLE_CONFIRMATION');
      expect(rows[0].channel).toBe('WHATSAPP');
      // Recipient is whichever APPROVER the factory scope resolved.
      expect(rows[0].recipientUserId).not.toBeNull();
    });

    it('carries the exchange details the template needs', async () => {
      const { exchangeId } = await raiseConfirmation();

      const [row] = await notificationsFor(exchangeId, NotificationType.CONFIRMATION_REQUESTED);
      const payload = row.payload as Record<string, string>;

      expect(payload.exchangeNumber).toMatch(/^EXC-\d{8}-\d{6}$/);
      expect(payload.factoryName).toEqual(expect.any(String));
      expect(payload.operatorName).toEqual(expect.any(String));
    });
  });

  describe('confirmation decided', () => {
    it('notifies the PIC when the approver approves', async () => {
      const { exchangeId, confirmationId } = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({ reason: 'ok' })
        .expect(200);

      const rows = await notificationsFor(exchangeId, NotificationType.CONFIRMATION_DECIDED);

      expect(rows).toHaveLength(1);
      expect(rows[0].recipientUserId).toBe(picUserId);
      expect((rows[0].payload as Record<string, string>).decision).toBe('APPROVED');
    });

    // A rejection is both a decision and a stuck condition.
    it('sends both a decision and a stuck notice on rejection', async () => {
      const { exchangeId, confirmationId } = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({ reason: 'Locate the fragment first' })
        .expect(200);

      const decided = await notificationsFor(exchangeId, NotificationType.CONFIRMATION_DECIDED);
      const stuck = await notificationsFor(exchangeId, NotificationType.EXCHANGE_STUCK);

      expect(decided).toHaveLength(1);
      expect(stuck).toHaveLength(1);
      expect(stuck[0].recipientUserId).toBe(picUserId);
      expect((stuck[0].payload as Record<string, string>).reason).toMatch(/rejected/i);
    });
  });

  describe('stock-blocked', () => {
    /** Drives a BENT exchange to NEW_NEEDLE_SELECTED, ready to issue. */
    const readyToIssue = async () => {
      sequence += 1;
      const pic = as(picToken);

      const created = await pic(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `notif-stock-${suffix}-${sequence}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(201);
      const id = bodyOf<{ id: string }>(created).id;

      await pic(request(server()).post(`/api/v1/exchanges/${id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await pic(request(server()).post(`/api/v1/exchanges/${id}/type`))
        .send({ exchangeTypeId: ids.bentTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);
      await pic(request(server()).post(`/api/v1/exchanges/${id}/evidence`))
        .field('evidenceType', 'OLD_NEEDLE')
        .attach('file', PNG, { filename: 'old.png', contentType: 'image/png' })
        .expect(201);
      await pic(request(server()).post(`/api/v1/exchanges/${id}/new-needle`))
        .send({ needleTypeId: ids.needleTypeId })
        .expect(200);

      return id;
    };

    it('notifies the PIC when an issue is refused for insufficient stock', async () => {
      const id = await readyToIssue();
      const balance = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/issue`))
        .send({ quantity: balance.quantity.toNumber() + 5 })
        .expect(409);

      const stuck = await notificationsFor(id, NotificationType.EXCHANGE_STUCK);
      expect(stuck).toHaveLength(1);
      expect(stuck[0].recipientUserId).toBe(picUserId);
      expect((stuck[0].payload as Record<string, string>).reason).toMatch(/enough stock/i);
    });

    // The rolled-back attempt must leave the ledger and balance untouched.
    it('creates no stock movement and does not change the balance', async () => {
      const id = await readyToIssue();
      const before = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/issue`))
        .send({ quantity: before.quantity.toNumber() + 5 })
        .expect(409);

      const after = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });

      expect(after.quantity.toNumber()).toBe(before.quantity.toNumber());
      expect(await prisma.stockMovement.count({ where: { referenceId: id } })).toBe(0);
    });

    // Mobile retries; the PIC should hear about it once.
    it('notifies once no matter how many times the issue is retried', async () => {
      const id = await readyToIssue();
      const balance = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });
      const tooMany = balance.quantity.toNumber() + 5;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/issue`))
          .send({ quantity: tooMany })
          .expect(409);
      }

      expect(await notificationsFor(id, NotificationType.EXCHANGE_STUCK)).toHaveLength(1);
    });

    it('sends no stuck notice when the issue succeeds', async () => {
      const id = await readyToIssue();

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/issue`))
        .send({ quantity: 1 })
        .expect(200);

      expect(await notificationsFor(id, NotificationType.EXCHANGE_STUCK)).toHaveLength(0);

      // Put the needle back: suites share one trolley, and a test that quietly
      // consumes stock eventually starves the ones after it.
      await prisma.inventoryBalance.update({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
        data: { quantity: { increment: 1 } },
      });
    });
  });

  describe('idempotency', () => {
    // Docs/14 §11: one logical notification per subject, template and recipient.
    it('does not duplicate the confirmation notice on a repeated raise', async () => {
      const { exchangeId, confirmationId } = await raiseConfirmation();

      // A second /fragment call is refused by the state machine, so the
      // notification cannot be raised twice for this confirmation.
      await as(picToken)(request(server()).post(`/api/v1/exchanges/${exchangeId}/fragment`))
        .send({ fragmentStatus: 'NOT_FOUND' })
        .expect(409);

      const rows = await prisma.notification.findMany({ where: { confirmationId } });
      expect(rows).toHaveLength(1);
    });

    it('gives every notification a unique dedupe key', async () => {
      const { exchangeId } = await raiseConfirmation();

      const rows = await notificationsFor(exchangeId);
      const keys = rows.map((row) => row.dedupeKey);

      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
