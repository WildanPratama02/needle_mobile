import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { AUDIT_ACTIONS } from '../../src/common/decorators/audit.decorator';
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
 * Audit trail for the exchange-critical actions (issue 10).
 *
 * Rows are written by `AuditLogInterceptor`, never by a service
 * (Backend/CLAUDE.md §5), so these assertions go through the API and then read
 * `audit_logs` directly.
 */
describe('Audit logging (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_audit_pic_${suffix}`;
  const approverUsername = `e2e_audit_approver_${suffix}`;
  const picRoleCode = `E2E_AUDIT_PIC_${suffix}`.toUpperCase();
  const approverRoleCode = `E2E_AUDIT_APR_${suffix}`.toUpperCase();

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
      PERMISSIONS.EXCHANGE_CANCEL,
    ]);
    const approverPermissions = await permissionFor([
      PERMISSIONS.CONFIRMATION_VIEW,
      PERMISSIONS.CONFIRMATION_APPROVE,
      PERMISSIONS.CONFIRMATION_REJECT,
    ]);

    const picRole = await prisma.role.create({
      data: {
        code: picRoleCode,
        name: 'E2E audit PIC',
        permissions: { create: picPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const approverRole = await prisma.role.create({
      data: {
        code: approverRoleCode,
        name: 'E2E audit approver',
        permissions: { create: approverPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const baseApproverRole = await prisma.role.upsert({
      where: { code: 'APPROVER' },
      update: {},
      create: { code: 'APPROVER', name: 'Approver' },
    });

    const pic = await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E Audit PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: picRole.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });
    picUserId = pic.id;

    const approver = await prisma.user.create({
      data: {
        username: approverUsername,
        name: 'E2E Audit Approver',
        passwordHash: await hash(password, 4),
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

      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
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

  const auditFor = (entityId: string, action?: string) =>
    prisma.auditLog.findMany({
      where: { entityId, action },
      orderBy: { timestamp: 'asc' },
    });

  const createExchange = async (): Promise<string> => {
    sequence += 1;
    const created = await as(picToken)(request(server()).post('/api/v1/exchanges'))
      .set('X-Request-ID', `req-${suffix}-${sequence}`)
      .send({
        clientTransactionId: `audit-${suffix}-${sequence}`,
        factoryId: ids.factoryId,
        trolleyId: ids.trolleyId,
        deviceId: ids.deviceId,
      })
      .expect(201);
    return bodyOf<{ id: string }>(created).id;
  };

  const driveToIssuable = async (id: string) => {
    const pic = as(picToken);
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
  };

  describe('CREATE_EXCHANGE', () => {
    it('records the actor, factory and request id', async () => {
      const id = await createExchange();

      const rows = await auditFor(id, AUDIT_ACTIONS.CREATE_EXCHANGE);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        entityType: 'Exchange',
        actorUserId: picUserId,
        factoryId: ids.factoryId,
      });
      expect(rows[0].requestId).toMatch(/^req-/);
      expect(rows[0].beforeData).toBeNull();
      expect(rows[0].afterData).toMatchObject({ status: 'CREATED' });
    });
  });

  describe('ISSUE_NEEDLE', () => {
    it('records a successful issue', async () => {
      const id = await createExchange();
      await driveToIssuable(id);

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/issue`))
        .send({ quantity: 1 })
        .expect(200);

      const rows = await auditFor(id, AUDIT_ACTIONS.ISSUE_NEEDLE);
      expect(rows).toHaveLength(1);
      expect(rows[0].afterData).toMatchObject({ status: 'NEEDLE_ISSUED' });

      // Put the needle back so later suites are not starved.
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

    // A rolled-back attempt is not an action that happened.
    it('records nothing when the issue is refused', async () => {
      const id = await createExchange();
      await driveToIssuable(id);
      const balance = await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      });

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/issue`))
        .send({ quantity: balance.quantity.toNumber() + 10 })
        .expect(409);

      expect(await auditFor(id, AUDIT_ACTIONS.ISSUE_NEEDLE)).toHaveLength(0);
    });
  });

  describe('CANCEL_EXCHANGE', () => {
    // Not in CLAUDE.md §5's list, but Docs/02 §22 and Docs/03 UC-MOB-014 both
    // require an audit trail for cancellation.
    it('records a cancellation', async () => {
      const id = await createExchange();

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/cancel`))
        .send({ reason: 'Operator left the line' })
        .expect(200);

      const rows = await auditFor(id, AUDIT_ACTIONS.CANCEL_EXCHANGE);
      expect(rows).toHaveLength(1);
      expect(rows[0].afterData).toMatchObject({ status: 'CANCELLED' });
    });
  });

  describe('confirmation decisions', () => {
    const raiseConfirmation = async (): Promise<string> => {
      const id = await createExchange();
      const pic = as(picToken);

      await pic(request(server()).post(`/api/v1/exchanges/${id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await pic(request(server()).post(`/api/v1/exchanges/${id}/type`))
        .send({ exchangeTypeId: ids.brokenTypeId, oldNeedleTypeId: ids.needleTypeId })
        .expect(200);
      const fragment = await pic(request(server()).post(`/api/v1/exchanges/${id}/fragment`))
        .send({ fragmentStatus: 'NOT_FOUND' })
        .expect(200);

      return bodyOf<{ confirmationId: string }>(fragment).confirmationId;
    };

    it('records APPROVE_CONFIRMATION against the approver', async () => {
      const confirmationId = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({ reason: 'ok' })
        .expect(200);

      const rows = await auditFor(confirmationId, AUDIT_ACTIONS.APPROVE_CONFIRMATION);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ entityType: 'Confirmation', actorUserId: approverUserId });
    });

    it('records REJECT_CONFIRMATION', async () => {
      const confirmationId = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({ reason: 'Locate the fragment first' })
        .expect(200);

      const rows = await auditFor(confirmationId, AUDIT_ACTIONS.REJECT_CONFIRMATION);
      expect(rows).toHaveLength(1);
      expect(rows[0].afterData).toMatchObject({ status: 'REJECTED' });
    });

    it('records nothing for a second decision attempt', async () => {
      const confirmationId = await raiseConfirmation();

      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/approve`),
      )
        .send({})
        .expect(200);
      await as(approverToken)(
        request(server()).post(`/api/v1/confirmations/${confirmationId}/reject`),
      )
        .send({ reason: 'too late' })
        .expect(409);

      expect(await auditFor(confirmationId, AUDIT_ACTIONS.REJECT_CONFIRMATION)).toHaveLength(0);
    });
  });

  describe('scope', () => {
    // Reads and non-critical transitions stay out of the audit trail.
    it('does not audit reads or intermediate transitions', async () => {
      const id = await createExchange();

      await as(picToken)(request(server()).post(`/api/v1/exchanges/${id}/operator`))
        .send({ rfidUid: ids.rfidUid })
        .expect(200);
      await as(picToken)(request(server()).get(`/api/v1/exchanges/${id}`)).expect(200);

      const rows = await auditFor(id);
      expect(rows.map((row) => row.action)).toEqual([AUDIT_ACTIONS.CREATE_EXCHANGE]);
    });
  });
});
