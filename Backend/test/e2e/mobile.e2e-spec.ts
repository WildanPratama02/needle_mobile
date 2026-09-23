import { randomUUID } from 'crypto';

import { INestApplication } from '@nestjs/common';
import { ConfirmationStatus, DeviceStatus, EntityStatus, LocationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';
import { createTestApp } from './create-test-app';

interface ErrorBody {
  code: string;
  message: string;
  details: string[];
  context?: Record<string, unknown>;
}

interface MobileExchange {
  id: string;
  clientTransactionId: string;
  status: string;
  confirmationStatus: string | null;
}

interface CommandResult {
  commandId: string;
  clientTransactionId: string;
  commandType: string;
  status: string;
  referenceId: string | null;
  error?: ErrorBody;
  exchange: MobileExchange | null;
}

interface SyncBody {
  results: CommandResult[];
  changes: {
    exchanges: MobileExchange[];
    hasMore: boolean;
    masterDataVersions: Record<string, string>;
  };
  nextCursor: string;
  serverTime: string;
}

const data = <T>(response: { body: unknown }) => (response.body as { data: T }).data;
const errorOf = (response: { body: unknown }) => (response.body as { error: ErrorBody }).error;

/** Changes younger than the pull's settle window (2 s) are held back; wait them out. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 2200));

/** Smallest valid PNG — the evidence endpoint stores it in MinIO for real. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * The tablet's backend surface end to end (`.scratch/mobile-backend`, Docs/12
 * §9, §18–19): device context, heartbeat, RFID lookup, bootstrap and offline
 * sync, against the real database and MinIO. Fixtures live on a trolley of
 * their own so stock assertions are exact.
 */
describe('Mobile surface (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_mob_pic_${suffix}`;
  const nomobileUsername = `e2e_mob_nomobile_${suffix}`;
  const outsiderUsername = `e2e_mob_outsider_${suffix}`;
  const approverUsername = `e2e_mob_approver_${suffix}`;
  const picRoleCode = `E2E_MOB_PIC_${suffix}`.toUpperCase();
  const nomobileRoleCode = `E2E_MOB_NOMOB_${suffix}`.toUpperCase();

  let picToken: string;
  let nomobileToken: string;
  let outsiderToken: string;

  const ids = {} as {
    factoryId: string;
    otherFactoryId: string;
    trolleyId: string;
    trolleyLocationId: string;
    storageLocationId: string;
    otherLocationId: string;
    otherTrolleyId: string;
    deviceId: string;
    revokedDeviceId: string;
    needleTypeId: string;
    bentTypeId: string;
    brokenTypeId: string;
    mappingIds: string[];
    employeeIds: string[];
  };
  const uids = {
    active: `UID-MOB-${suffix}`,
    revoked: `UID-MOB-REV-${suffix}`,
    inactiveHolder: `UID-MOB-INH-${suffix}`,
    otherFactory: `UID-MOB-OTH-${suffix}`,
  };

  const server = () => app.getHttpServer() as Server;
  const login = async (username: string) =>
    data<{ accessToken: string }>(
      await request(server()).post('/api/v1/auth/login').send({ username, password }).expect(200),
    ).accessToken;

  const as = (token: string, req: request.Test, deviceId: string | null = ids.deviceId) => {
    const authed = req.set('Authorization', `Bearer ${token}`);
    return deviceId ? authed.set('X-Device-ID', deviceId) : authed;
  };

  const sync = (body: Record<string, unknown>, token = picToken) =>
    as(token, request(server()).post('/api/v1/mobile/sync')).send({
      deviceId: ids.deviceId,
      ...body,
    });

  const balance = async () =>
    (
      await prisma.inventoryBalance.findUniqueOrThrow({
        where: {
          locationId_needleTypeId: {
            locationId: ids.trolleyLocationId,
            needleTypeId: ids.needleTypeId,
          },
        },
      })
    ).quantity.toNumber();

  const setBalance = (quantity: number) =>
    prisma.inventoryBalance.update({
      where: {
        locationId_needleTypeId: {
          locationId: ids.trolleyLocationId,
          needleTypeId: ids.needleTypeId,
        },
      },
      data: { quantity },
    });

  const command = (
    clientTransactionId: string,
    commandType: string,
    payload: Record<string, unknown> = {},
  ) => ({ commandId: randomUUID(), clientTransactionId, commandType, payload });

  const uploadEvidence = (exchangeId: string) =>
    as(picToken, request(server()).post(`/api/v1/exchanges/${exchangeId}/evidence`), null)
      .field('evidenceType', 'OLD_NEEDLE')
      .attach('file', PNG, { filename: 'old-needle.png', contentType: 'image/png' })
      .expect(201);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const seededTrolley = await prisma.trolley.findFirstOrThrow();
    ids.factoryId = seededTrolley.factoryId;
    ids.needleTypeId = (
      await prisma.needleType.findFirstOrThrow({ where: { status: EntityStatus.ACTIVE } })
    ).id;
    ids.bentTypeId = (await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BENT' } })).id;
    ids.brokenTypeId = (
      await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BROKEN' } })
    ).id;

    const trolleyLocation = await prisma.location.create({
      data: {
        factoryId: ids.factoryId,
        code: `LOC-MOB-${suffix}`,
        name: 'Mobile e2e trolley',
        locationType: LocationType.TROLLEY,
      },
    });
    ids.trolleyLocationId = trolleyLocation.id;
    const trolley = await prisma.trolley.create({
      data: {
        factoryId: ids.factoryId,
        locationId: trolleyLocation.id,
        code: `TRL-MOB-${suffix}`,
        name: 'Mobile e2e trolley',
      },
    });
    ids.trolleyId = trolley.id;

    const storage = await prisma.location.create({
      data: {
        factoryId: ids.factoryId,
        code: `LOC-MOB-USED-${suffix}`,
        name: 'Mobile e2e used-needle box',
        locationType: LocationType.USED_NEEDLE_STORAGE,
      },
    });
    ids.storageLocationId = storage.id;
    ids.mappingIds = await Promise.all(
      [ids.bentTypeId, ids.brokenTypeId].map(async (exchangeTypeId) => {
        const mapping = await prisma.storageMapping.create({
          data: { trolleyId: trolley.id, exchangeTypeId, storageLocationId: storage.id },
        });
        return mapping.id;
      }),
    );

    await prisma.inventoryBalance.create({
      data: {
        factoryId: ids.factoryId,
        locationId: trolleyLocation.id,
        needleTypeId: ids.needleTypeId,
        quantity: 5,
      },
    });

    ids.deviceId = (
      await prisma.device.create({
        data: {
          deviceCode: `DEV-MOB-${suffix}`,
          deviceName: 'Mobile e2e tablet',
          serialNumber: `SN-MOB-${suffix}`,
          factoryId: ids.factoryId,
          trolleyId: trolley.id,
        },
      })
    ).id;
    ids.revokedDeviceId = (
      await prisma.device.create({
        data: {
          deviceCode: `DEV-MOB-REV-${suffix}`,
          deviceName: 'Mobile e2e revoked tablet',
          serialNumber: `SN-MOB-REV-${suffix}`,
          factoryId: ids.factoryId,
          trolleyId: trolley.id,
          status: DeviceStatus.REVOKED,
        },
      })
    ).id;

    const other = await prisma.factory.create({
      data: { code: `FAC-MOB-${suffix}`, name: 'Mobile e2e other factory', timezone: 'UTC' },
    });
    ids.otherFactoryId = other.id;
    const otherLocation = await prisma.location.create({
      data: {
        factoryId: other.id,
        code: `LOC-MOB-OTH-${suffix}`,
        name: 'Other trolley',
        locationType: LocationType.TROLLEY,
      },
    });
    ids.otherLocationId = otherLocation.id;
    ids.otherTrolleyId = (
      await prisma.trolley.create({
        data: {
          factoryId: other.id,
          locationId: otherLocation.id,
          code: `TRL-MOB-OTH-${suffix}`,
          name: 'Other trolley',
        },
      })
    ).id;

    const employee = (number: string, factoryId: string, status: EntityStatus) =>
      prisma.employee.create({
        data: { employeeNumber: `${number}-${suffix}`, name: number, factoryId, status },
      });
    const operator = await employee('EMP-MOB', ids.factoryId, EntityStatus.ACTIVE);
    const inactive = await employee('EMP-MOB-INA', ids.factoryId, EntityStatus.INACTIVE);
    const outsider = await employee('EMP-MOB-OTH', other.id, EntityStatus.ACTIVE);
    ids.employeeIds = [operator.id, inactive.id, outsider.id];

    await prisma.rfidCard.createMany({
      data: [
        { rfidUid: uids.active, employeeId: operator.id },
        {
          rfidUid: uids.revoked,
          employeeId: operator.id,
          status: EntityStatus.INACTIVE,
          revokedAt: new Date(),
        },
        { rfidUid: uids.inactiveHolder, employeeId: inactive.id },
        { rfidUid: uids.otherFactory, employeeId: outsider.id },
      ],
    });

    const permissionsFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );
    const exchangeCodes = [
      PERMISSIONS.EXCHANGE_VIEW,
      PERMISSIONS.EXCHANGE_CREATE,
      PERMISSIONS.EXCHANGE_ISSUE,
      PERMISSIONS.EXCHANGE_COMPLETE,
      PERMISSIONS.EXCHANGE_CANCEL,
    ];
    const picRole = await prisma.role.create({
      data: {
        code: picRoleCode,
        name: 'E2E mobile PIC',
        permissions: {
          create: (await permissionsFor([...exchangeCodes, PERMISSIONS.MOBILE_OPERATE])).map(
            (p) => ({ permissionId: p.id }),
          ),
        },
      },
    });
    const nomobileRole = await prisma.role.create({
      data: {
        code: nomobileRoleCode,
        name: 'E2E PIC without MOBILE_OPERATE',
        permissions: {
          create: (await permissionsFor(exchangeCodes)).map((p) => ({ permissionId: p.id })),
        },
      },
    });

    const user = async (username: string, roleId: string, factoryId: string) =>
      prisma.user.create({
        data: {
          username,
          name: username,
          passwordHash: await hash(password, 4),
          roles: { create: [{ roleId }] },
          factoryScopes: { create: [{ factoryId }] },
        },
      });
    await user(picUsername, picRole.id, ids.factoryId);
    await user(nomobileUsername, nomobileRole.id, ids.factoryId);
    await user(outsiderUsername, picRole.id, other.id);

    // A factory-scoped APPROVER, or FRAGMENT_VALIDATION NOT_FOUND cannot
    // raise a confirmation (round 4 Q11).
    const approverRole = await prisma.role.upsert({
      where: { code: 'APPROVER' },
      update: {},
      create: { code: 'APPROVER', name: 'Approver' },
    });
    await user(approverUsername, approverRole.id, ids.factoryId);

    picToken = await login(picUsername);
    nomobileToken = await login(nomobileUsername);
    outsiderToken = await login(outsiderUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const devices = [ids.deviceId, ids.revokedDeviceId].filter(Boolean);
      const exchanges = await prisma.exchange.findMany({
        where: { deviceId: { in: devices } },
        select: { id: true },
      });
      const exchangeIds = exchanges.map((row) => row.id);

      await prisma.auditLog.deleteMany({ where: { entityId: { in: exchangeIds } } });
      await prisma.stockMovement.deleteMany({ where: { referenceId: { in: exchangeIds } } });
      await prisma.exchange.deleteMany({ where: { id: { in: exchangeIds } } });
      await prisma.idempotencyKey.deleteMany({ where: { deviceId: { in: devices } } });
      await prisma.device.deleteMany({ where: { id: { in: devices } } });
      await prisma.inventoryBalance.deleteMany({ where: { locationId: ids.trolleyLocationId } });
      await prisma.storageMapping.deleteMany({ where: { id: { in: ids.mappingIds ?? [] } } });
      await prisma.rfidCard.deleteMany({ where: { rfidUid: { in: Object.values(uids) } } });
      await prisma.employee.deleteMany({ where: { id: { in: ids.employeeIds ?? [] } } });
      await prisma.user.deleteMany({
        where: {
          username: { in: [picUsername, nomobileUsername, outsiderUsername, approverUsername] },
        },
      });
      await prisma.role.deleteMany({ where: { code: { in: [picRoleCode, nomobileRoleCode] } } });
      await prisma.trolley.deleteMany({
        where: { id: { in: [ids.trolleyId, ids.otherTrolleyId].filter(Boolean) } },
      });
      await prisma.location.deleteMany({
        where: {
          id: {
            in: [ids.trolleyLocationId, ids.storageLocationId, ids.otherLocationId].filter(Boolean),
          },
        },
      });
      if (ids.otherFactoryId) {
        await prisma.factory.deleteMany({ where: { id: ids.otherFactoryId } });
      }
    }
    await app?.close();
  });

  describe('device context', () => {
    it('refuses a request without X-Device-ID with 400 DEVICE_CONTEXT_REQUIRED', async () => {
      const response = await as(
        picToken,
        request(server()).get('/api/v1/mobile/bootstrap'),
        null,
      ).expect(400);

      expect(errorOf(response).code).toBe('DEVICE_CONTEXT_REQUIRED');
    });

    it('refuses an unregistered device with 404 DEVICE_NOT_FOUND', async () => {
      const response = await as(
        picToken,
        request(server()).get('/api/v1/mobile/bootstrap'),
        randomUUID(),
      ).expect(404);

      expect(errorOf(response).code).toBe('DEVICE_NOT_FOUND');
    });

    it('refuses a revoked device with 403 DEVICE_INACTIVE naming the status', async () => {
      const response = await as(
        picToken,
        request(server()).get('/api/v1/mobile/bootstrap'),
        ids.revokedDeviceId,
      ).expect(403);

      expect(errorOf(response)).toMatchObject({
        code: 'DEVICE_INACTIVE',
        context: { status: 'REVOKED' },
      });
    });

    it('refuses a caller without MOBILE_OPERATE', async () => {
      const response = await as(
        nomobileToken,
        request(server()).get('/api/v1/mobile/bootstrap'),
      ).expect(403);

      expect(errorOf(response).code).toBe('FORBIDDEN');
    });

    it('refuses a caller scoped to another factory', async () => {
      await as(outsiderToken, request(server()).get('/api/v1/mobile/bootstrap')).expect(403);
    });
  });

  describe('POST /devices/:id/heartbeat', () => {
    it('records lastSeenAt and appVersion and reports the clock offset', async () => {
      const deviceTime = new Date(Date.now() - 60_000).toISOString();
      const response = await as(
        picToken,
        request(server()).post(`/api/v1/devices/${ids.deviceId}/heartbeat`),
      )
        .send({ appVersion: '1.2.3', deviceTime })
        .expect(200);

      const body = data<{ status: string; clockOffsetMs: number; serverTime: string }>(response);
      expect(body.status).toBe('ACTIVE');
      expect(body.clockOffsetMs).toBeGreaterThanOrEqual(59_000);

      const device = await prisma.device.findUniqueOrThrow({ where: { id: ids.deviceId } });
      expect(device.appVersion).toBe('1.2.3');
      expect(device.lastSeenAt).not.toBeNull();
    });

    it('refuses a heartbeat for another device with 403 DEVICE_MISMATCH', async () => {
      const response = await as(
        picToken,
        request(server()).post(`/api/v1/devices/${ids.revokedDeviceId}/heartbeat`),
      )
        .send({ appVersion: '1.2.3' })
        .expect(403);

      expect(errorOf(response).code).toBe('DEVICE_MISMATCH');
    });
  });

  describe('GET /rfid/cards/uid/:rfidUid', () => {
    const lookup = (uid: string) =>
      as(picToken, request(server()).get(`/api/v1/rfid/cards/uid/${encodeURIComponent(uid)}`));

    it('resolves the operator in the Docs/13 §8 shape', async () => {
      const response = await lookup(uids.active).expect(200);

      expect(data(response)).toEqual({
        employee: expect.objectContaining({
          id: ids.employeeIds[0],
          employeeNumber: `EMP-MOB-${suffix}`,
          factoryId: ids.factoryId,
          status: 'ACTIVE',
        }) as unknown,
        rfidCard: expect.objectContaining({ uid: uids.active, status: 'ACTIVE' }) as unknown,
      });
    });

    it.each([
      ['an unknown card', () => `NOPE-${suffix}`, 404, 'RFID_NOT_FOUND'],
      ['a revoked card', () => uids.revoked, 422, 'RFID_INACTIVE'],
      ['an inactive card holder', () => uids.inactiveHolder, 422, 'EMPLOYEE_INACTIVE'],
      ['a card of another factory', () => uids.otherFactory, 403, 'FACTORY_SCOPE_DENIED'],
    ])('refuses %s', async (_label, uid, status, code) => {
      const response = await lookup(uid()).expect(status);

      expect(errorOf(response).code).toBe(code);
    });
  });

  describe('GET /mobile/bootstrap', () => {
    it("returns the device's factory, trolley and master data", async () => {
      const response = await as(picToken, request(server()).get('/api/v1/mobile/bootstrap')).expect(
        200,
      );
      const body = data<{
        device: { id: string };
        factory: { id: string };
        trolley: { id: string; locationId: string };
        needleTypes: { id: string }[];
        exchangeTypes: { code: string }[];
        storageMappings: { storageLocationId: string }[];
        masterDataVersions: Record<string, string>;
        syncCursor: string;
      }>(response);

      expect(body.device.id).toBe(ids.deviceId);
      expect(body.factory.id).toBe(ids.factoryId);
      expect(body.trolley).toMatchObject({ id: ids.trolleyId, locationId: ids.trolleyLocationId });
      expect(body.needleTypes.map((row) => row.id)).toContain(ids.needleTypeId);
      expect(body.exchangeTypes.map((row) => row.code)).toEqual(
        expect.arrayContaining(['BENT', 'BROKEN']),
      );
      expect(body.storageMappings).toHaveLength(2);
      expect(body.storageMappings[0].storageLocationId).toBe(ids.storageLocationId);
      expect(typeof body.syncCursor).toBe('string');

      const again = await as(picToken, request(server()).get('/api/v1/mobile/bootstrap'))
        .query({
          needleTypesVersion: body.masterDataVersions.needleTypes,
          exchangeTypesVersion: body.masterDataVersions.exchangeTypes,
          storageMappingsVersion: body.masterDataVersions.storageMappings,
        })
        .expect(200);

      expect(data(again)).toMatchObject({
        needleTypes: null,
        exchangeTypes: null,
        storageMappings: null,
      });
    });
  });

  describe('POST /mobile/sync', () => {
    it('runs a whole BENT exchange offline, around the evidence upload, and replays safely', async () => {
      const ctid = randomUUID();
      const before = await balance();

      const first = await sync({
        commands: [
          command(ctid, 'CREATE_EXCHANGE'),
          command(ctid, 'ASSIGN_OPERATOR', { rfidUid: uids.active }),
          command(ctid, 'SELECT_EXCHANGE_TYPE', {
            exchangeTypeId: ids.bentTypeId,
            oldNeedleTypeId: ids.needleTypeId,
          }),
          // Evidence is not a sync command: this step is refused until it lands.
          command(ctid, 'SELECT_NEW_NEEDLE', { needleTypeId: ids.needleTypeId }),
        ],
      }).expect(200);
      const firstResults = data<SyncBody>(first).results;

      expect(firstResults.map((r) => r.status)).toEqual([
        'SUCCESS',
        'SUCCESS',
        'SUCCESS',
        'REJECTED',
      ]);
      expect(firstResults[3]).toMatchObject({
        error: {
          code: 'EXCHANGE_INVALID_STATE',
          context: { currentState: 'EXCHANGE_TYPE_SELECTED' },
        },
        exchange: { status: 'EXCHANGE_TYPE_SELECTED', clientTransactionId: ctid },
      });

      const exchangeId = firstResults[0].referenceId!;
      await uploadEvidence(exchangeId);

      const rest = [
        command(ctid, 'SELECT_NEW_NEEDLE', { needleTypeId: ids.needleTypeId }),
        command(ctid, 'ISSUE_NEEDLE', { quantity: 1 }),
        command(ctid, 'STORE_USED_NEEDLE'),
        command(ctid, 'COMPLETE_EXCHANGE'),
      ];
      const second = data<SyncBody>(await sync({ commands: rest }).expect(200));

      expect(second.results.map((r) => r.status)).toEqual([
        'SUCCESS',
        'SUCCESS',
        'SUCCESS',
        'SUCCESS',
      ]);
      expect(second.results[3].exchange?.status).toBe('COMPLETED');
      expect(await balance()).toBe(before - 1);

      // A network timeout: the tablet resends the same batch.
      const replay = data<SyncBody>(await sync({ commands: rest }).expect(200));

      expect(replay.results.map((r) => r.status)).toEqual([
        'IDEMPOTENT_SUCCESS',
        'IDEMPOTENT_SUCCESS',
        'IDEMPOTENT_SUCCESS',
        'IDEMPOTENT_SUCCESS',
      ]);
      expect(await balance()).toBe(before - 1);
      expect(
        await prisma.stockMovement.count({
          where: { referenceType: 'EXCHANGE', referenceId: exchangeId },
        }),
      ).toBe(1);

      const audit = await prisma.auditLog.findMany({
        where: { entityId: exchangeId },
        orderBy: { timestamp: 'asc' },
      });
      expect(audit.map((row) => row.action)).toEqual(['CREATE_EXCHANGE', 'ISSUE_NEEDLE']);
      expect(audit[1]).toMatchObject({
        actorUserId: expect.any(String) as string,
        factoryId: ids.factoryId,
        metadata: expect.objectContaining({
          source: 'MOBILE_SYNC',
          deviceId: ids.deviceId,
          commandType: 'ISSUE_NEEDLE',
        }) as unknown,
      });
    });

    it('rejects an issue the trolley cannot cover, skips the rest of that exchange only', async () => {
      const blocked = randomUUID();
      const other = randomUUID();

      const opened = data<SyncBody>(
        await sync({
          commands: [
            command(blocked, 'CREATE_EXCHANGE'),
            command(blocked, 'ASSIGN_OPERATOR', { rfidUid: uids.active }),
            command(blocked, 'SELECT_EXCHANGE_TYPE', {
              exchangeTypeId: ids.bentTypeId,
              oldNeedleTypeId: ids.needleTypeId,
            }),
          ],
        }).expect(200),
      );
      await uploadEvidence(opened.results[0].referenceId!);
      await sync({
        commands: [command(blocked, 'SELECT_NEW_NEEDLE', { needleTypeId: ids.needleTypeId })],
      }).expect(200);

      const stock = await balance();
      await setBalance(0);

      try {
        const response = data<SyncBody>(
          await sync({
            commands: [
              command(blocked, 'ISSUE_NEEDLE', { quantity: 1 }),
              command(other, 'CREATE_EXCHANGE'),
              command(blocked, 'STORE_USED_NEEDLE'),
            ],
          }).expect(200),
        );

        expect(response.results.map((r) => r.status)).toEqual(['REJECTED', 'SUCCESS', 'SKIPPED']);
        expect(response.results[0]).toMatchObject({
          error: {
            code: 'INVENTORY_INSUFFICIENT_STOCK',
            context: { availableQuantity: 0, requestedQuantity: 1 },
          },
          exchange: { status: 'NEW_NEEDLE_SELECTED' },
        });
      } finally {
        await setBalance(stock);
      }

      // Restocked: the same command is evaluated again, not replayed as a rejection.
      const retried = data<SyncBody>(
        await sync({ commands: [command(blocked, 'ISSUE_NEEDLE', { quantity: 1 })] }).expect(200),
      );
      expect(retried.results[0].status).toBe('SUCCESS');
    });

    it('returns changes made elsewhere, then moves the cursor past them', async () => {
      const ctid = randomUUID();
      const opened = data<SyncBody>(
        await sync({
          commands: [
            command(ctid, 'CREATE_EXCHANGE'),
            command(ctid, 'ASSIGN_OPERATOR', { rfidUid: uids.active }),
            command(ctid, 'SELECT_EXCHANGE_TYPE', {
              exchangeTypeId: ids.brokenTypeId,
              oldNeedleTypeId: ids.needleTypeId,
            }),
            command(ctid, 'FRAGMENT_VALIDATION', { fragmentStatus: 'NOT_FOUND' }),
          ],
        }).expect(200),
      );
      expect(opened.results[3].exchange).toMatchObject({
        status: 'CONFIRMATION_PENDING',
        confirmationStatus: 'PENDING',
      });

      // Catch up to "now", so only what happens next is reported.
      await settle();
      let cursor = data<SyncBody>(await sync({ commands: [] }).expect(200)).nextCursor;
      for (;;) {
        const page = data<SyncBody>(await sync({ cursor, commands: [] }).expect(200));
        cursor = page.nextCursor;
        if (!page.changes.hasMore) break;
      }

      // An approver decides — a change the tablet did not make.
      await prisma.confirmation.update({
        where: { exchangeId: opened.results[0].referenceId! },
        data: { status: ConfirmationStatus.APPROVED, decidedAt: new Date() },
      });
      await settle();

      const pulled = data<SyncBody>(await sync({ cursor, commands: [] }).expect(200));
      expect(pulled.changes.exchanges).toEqual([
        expect.objectContaining({
          clientTransactionId: ctid,
          status: 'CONFIRMATION_PENDING',
          confirmationStatus: 'APPROVED',
        }),
      ]);

      const after = data<SyncBody>(
        await sync({ cursor: pulled.nextCursor, commands: [] }).expect(200),
      );
      expect(after.changes.exchanges).toEqual([]);
    });

    it('refuses a body naming another device, a malformed cursor, and an oversized batch', async () => {
      expect(
        errorOf(await sync({ deviceId: ids.revokedDeviceId, commands: [] }).expect(403)).code,
      ).toBe('DEVICE_MISMATCH');

      await sync({ cursor: 'not-a-cursor', commands: [] }).expect(400);

      const tooMany = Array.from({ length: 51 }, () => command(randomUUID(), 'CREATE_EXCHANGE'));
      await sync({ commands: tooMany }).expect(400);
    });
  });

  describe('GET /exchanges history filters', () => {
    it("narrows to this device's exchanges and a date window", async () => {
      const response = await as(picToken, request(server()).get('/api/v1/exchanges'), null)
        .query({ deviceId: ids.deviceId, pageSize: 100 })
        .expect(200);
      const rows = data<{ deviceId: string }[]>(response);

      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.deviceId === ids.deviceId)).toBe(true);

      const future = await as(picToken, request(server()).get('/api/v1/exchanges'), null)
        .query({ deviceId: ids.deviceId, dateFrom: new Date(Date.now() + 3_600_000).toISOString() })
        .expect(200);
      expect(data<unknown[]>(future)).toEqual([]);

      await as(picToken, request(server()).get('/api/v1/exchanges'), null)
        .query({ dateFrom: '2026-08-02T00:00:00Z', dateTo: '2026-08-01T00:00:00Z' })
        .expect(400);
    });
  });
});
