import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
import { AUDIT_ACTIONS } from '../../src/common/decorators/audit.decorator';
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

interface DeviceRow {
  id: string;
  deviceCode: string;
  deviceName: string;
  serialNumber: string;
  factoryId: string;
  trolleyId: string;
  status: string;
  appVersion: string | null;
  lastSeenAt: string | null;
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * Device lifecycle (`.scratch/device-and-inventory/spec.md`, GAP-13 Phase 1).
 * Same HTTP-boundary discipline as every prior suite in this chain: assert
 * status code, envelope, rows returned, the scope boundary and the audit row
 * that landed — never a service's internal `where` clause.
 */
describe('Devices (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const viewerUsername = `e2e_dev_viewer_${suffix}`;
  const outsiderUsername = `e2e_dev_outsider_${suffix}`;
  const nopermUsername = `e2e_dev_noperm_${suffix}`;
  const trolleyScopedUsername = `e2e_dev_trolleyscoped_${suffix}`;
  const viewerRoleCode = `E2E_DEV_VIEW_${suffix}`.toUpperCase();
  const nopermRoleCode = `E2E_DEV_NONE_${suffix}`.toUpperCase();

  let viewerToken: string;
  let outsiderToken: string;
  let nopermToken: string;
  let trolleyScopedToken: string;

  let homeFactoryId: string;
  let homeTrolleyAId: string;
  let homeLocationAId: string;
  let homeTrolleyBId: string;
  let homeLocationBId: string;
  let otherFactoryId: string;
  let otherLocationId: string;
  let otherTrolleyId: string;
  let otherDeviceId: string;
  let seededDeviceAId: string;

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
  const post = (token: string, path: string, body: object = {}) =>
    as(token)(request(server()).post(`/api/v1${path}`)).send(body);

  const auditFor = (entityId: string, action?: string) =>
    prisma.auditLog.findMany({ where: { entityId, action }, orderBy: { timestamp: 'asc' } });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const seededTrolley = await prisma.trolley.findFirstOrThrow();
    homeFactoryId = seededTrolley.factoryId;
    homeTrolleyAId = seededTrolley.id;
    homeLocationAId = seededTrolley.locationId;

    const homeLocationB = await prisma.location.create({
      data: {
        factoryId: homeFactoryId,
        code: `LOC-DEVB-${suffix}`,
        name: 'Devices e2e second trolley location',
        locationType: 'TROLLEY',
      },
    });
    homeLocationBId = homeLocationB.id;
    const homeTrolleyB = await prisma.trolley.create({
      data: {
        factoryId: homeFactoryId,
        locationId: homeLocationBId,
        code: `TRL-DEVB-${suffix}`,
        name: 'Devices e2e second trolley',
      },
    });
    homeTrolleyBId = homeTrolleyB.id;

    const other = await prisma.factory.create({
      data: {
        code: `FAC-DEV-${suffix}`,
        name: 'Devices e2e other factory',
        timezone: 'Asia/Jakarta',
      },
    });
    otherFactoryId = other.id;
    const otherLocation = await prisma.location.create({
      data: {
        factoryId: otherFactoryId,
        code: `LOC-DEV-${suffix}`,
        name: 'Devices e2e other trolley location',
        locationType: 'TROLLEY',
      },
    });
    otherLocationId = otherLocation.id;
    const otherTrolley = await prisma.trolley.create({
      data: {
        factoryId: otherFactoryId,
        locationId: otherLocation.id,
        code: `TRL-DEV-${suffix}`,
        name: 'Devices e2e other trolley',
      },
    });
    otherTrolleyId = otherTrolley.id;

    const otherDevice = await prisma.device.create({
      data: {
        deviceCode: `DEV-OTHER-${suffix}`,
        deviceName: 'Other factory device',
        serialNumber: `SN-OTHER-${suffix}`,
        factoryId: otherFactoryId,
        trolleyId: otherTrolleyId,
      },
    });
    otherDeviceId = otherDevice.id;

    const seededDeviceA = await prisma.device.create({
      data: {
        deviceCode: `DEV-A-${suffix}`,
        deviceName: 'Home trolley A device',
        serialNumber: `SN-A-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      },
    });
    seededDeviceAId = seededDeviceA.id;
    await prisma.device.create({
      data: {
        deviceCode: `DEV-B-${suffix}`,
        deviceName: 'Home trolley B device',
        serialNumber: `SN-B-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyBId,
      },
    });

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const viewPermissions = await permissionFor([PERMISSIONS.DEVICE_MANAGE]);
    const otherPermissions = await permissionFor([PERMISSIONS.EXCHANGE_VIEW]);

    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E devices viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const nopermRole = await prisma.role.create({
      data: {
        code: nopermRoleCode,
        name: 'E2E no device-manage',
        permissions: { create: otherPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E Devices Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });

    await prisma.user.create({
      data: {
        username: outsiderUsername,
        name: 'E2E Devices Outsider',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: otherFactoryId }] },
      },
    });

    await prisma.user.create({
      data: {
        username: nopermUsername,
        name: 'E2E Devices No Permission',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: nopermRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });

    // Scoped to the whole home factory but only trolley A's location — the
    // second scope dimension (Device story 16).
    await prisma.user.create({
      data: {
        username: trolleyScopedUsername,
        name: 'E2E Devices Trolley-Scoped',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
        locationScopes: { create: [{ locationId: homeLocationAId }] },
      },
    });

    viewerToken = await login(viewerUsername);
    outsiderToken = await login(outsiderUsername);
    nopermToken = await login(nopermUsername);
    trolleyScopedToken = await login(trolleyScopedUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: {
          username: {
            in: [viewerUsername, outsiderUsername, nopermUsername, trolleyScopedUsername],
          },
        },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      await prisma.auditLog.deleteMany({ where: { entityType: 'Device' } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [viewerRoleCode, nopermRoleCode] } } });
      await prisma.device.deleteMany({
        where: {
          factoryId: { in: [homeFactoryId, otherFactoryId] },
          deviceCode: { contains: suffix },
        },
      });
      await prisma.trolley.deleteMany({ where: { id: { in: [homeTrolleyBId, otherTrolleyId] } } });
      await prisma.location.deleteMany({
        where: { id: { in: [homeLocationBId, otherLocationId] } },
      });
      await prisma.factory.deleteMany({ where: { id: otherFactoryId } });
    }
    await app?.close();
  });

  describe('authorized reads', () => {
    it('returns rows using the paginated envelope', async () => {
      const response = await get(viewerToken, '/devices').expect(200);
      const body = envelope<DeviceRow[]>(response);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
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

    it('exposes the fields the Devices screen needs', async () => {
      const response = await get(viewerToken, `/devices/${seededDeviceAId}`).expect(200);
      const row = envelope<DeviceRow>(response).data;

      expect(row).toEqual(
        expect.objectContaining({
          id: seededDeviceAId,
          deviceCode: `DEV-A-${suffix}`,
          deviceName: 'Home trolley A device',
          serialNumber: `SN-A-${suffix}`,
          factoryId: homeFactoryId,
          trolleyId: homeTrolleyAId,
          status: 'ACTIVE',
        }),
      );
    });

    it('returns 404 for an unknown id', async () => {
      await get(viewerToken, '/devices/8f14e45f-ceea-467a-9f5a-000000000000').expect(404);
    });

    it('rejects a malformed id', async () => {
      await get(viewerToken, '/devices/not-a-uuid').expect(400);
    });

    it('orders by deviceCode ascending', async () => {
      const response = await get(viewerToken, '/devices?pageSize=100').expect(200);
      const codes = envelope<DeviceRow[]>(response).data.map((row) => row.deviceCode);

      expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe('authorization', () => {
    it('rejects an unauthenticated request', async () => {
      await request(server()).get('/api/v1/devices').expect(401);
    });

    it('rejects a caller without DEVICE_MANAGE', async () => {
      const response = await get(nopermToken, '/devices').expect(403);
      expect(envelope<unknown>(response).success).toBe(false);
    });

    it('rejects a by-id read for a caller without DEVICE_MANAGE', async () => {
      await get(nopermToken, `/devices/${seededDeviceAId}`).expect(403);
    });
  });

  describe('factory scope', () => {
    it('returns only devices scoped to the caller factory', async () => {
      const response = await get(viewerToken, '/devices?pageSize=100').expect(200);
      const ids = envelope<DeviceRow[]>(response).data.map((row) => row.id);

      expect(ids).toContain(seededDeviceAId);
      expect(ids).not.toContain(otherDeviceId);
    });

    it('cannot widen scope by naming another factory', async () => {
      const response = await get(viewerToken, `/devices?factoryId=${otherFactoryId}`).expect(200);
      expect(envelope<DeviceRow[]>(response).data).toEqual([]);
    });

    it('refuses a by-id read of an out-of-scope device', async () => {
      await get(viewerToken, `/devices/${otherDeviceId}`).expect(403);
    });

    it('lets the outsider read its own factory devices', async () => {
      const response = await get(outsiderToken, '/devices?pageSize=100').expect(200);
      const ids = envelope<DeviceRow[]>(response).data.map((row) => row.id);
      expect(ids).toEqual([otherDeviceId]);
    });
  });

  describe('location scope (Device story 16)', () => {
    it('a trolley-scoped caller sees only devices on trolleys inside their location scope', async () => {
      const response = await get(trolleyScopedToken, '/devices?pageSize=100').expect(200);
      const ids = envelope<DeviceRow[]>(response).data.map((row) => row.id);

      expect(ids).toContain(seededDeviceAId);
      expect(ids.every((id) => id !== undefined)).toBe(true);
      // Trolley B lives at a different location, outside this caller's scope.
      for (const row of envelope<DeviceRow[]>(response).data) {
        expect(row.trolleyId).toBe(homeTrolleyAId);
      }
    });

    it('a factory-wide caller (no location scope) is unaffected — sees every trolley in the factory', async () => {
      const response = await get(viewerToken, '/devices?pageSize=100').expect(200);
      const trolleyIds = envelope<DeviceRow[]>(response).data.map((row) => row.trolleyId);

      expect(trolleyIds).toEqual(expect.arrayContaining([homeTrolleyAId, homeTrolleyBId]));
    });

    it('refuses a by-id read of a device outside the caller location scope', async () => {
      const [deviceB] = await prisma.device.findMany({ where: { trolleyId: homeTrolleyBId } });
      await get(trolleyScopedToken, `/devices/${deviceB.id}`).expect(403);
    });
  });

  describe('register', () => {
    it('registers a device and writes a DEVICE_BIND audit row', async () => {
      const response = await post(viewerToken, '/devices', {
        deviceCode: `DEV-NEW-${suffix}`,
        deviceName: 'New tablet',
        serialNumber: `SN-NEW-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      }).expect(201);

      const row = envelope<DeviceRow>(response).data;
      expect(row.status).toBe('ACTIVE');

      const rows = await auditFor(row.id, AUDIT_ACTIONS.DEVICE_BIND);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ entityType: 'Device' });
    });

    it('rejects a trolleyId that belongs to a different factory with 400', async () => {
      await post(viewerToken, '/devices', {
        deviceCode: `DEV-BAD-${suffix}`,
        deviceName: 'Bad pair',
        serialNumber: `SN-BAD-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: otherTrolleyId,
      }).expect(400);
    });

    it('rejects a duplicate deviceCode with 409', async () => {
      await post(viewerToken, '/devices', {
        deviceCode: `DEV-A-${suffix}`,
        deviceName: 'Duplicate',
        serialNumber: `SN-DUP-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      }).expect(409);
    });

    it('refuses registering against a factory outside the caller scope', async () => {
      await post(viewerToken, '/devices', {
        deviceCode: `DEV-OOS-${suffix}`,
        deviceName: 'Out of scope',
        serialNumber: `SN-OOS-${suffix}`,
        factoryId: otherFactoryId,
        trolleyId: otherTrolleyId,
      }).expect(403);
    });

    it('rejects a caller without DEVICE_MANAGE', async () => {
      await post(nopermToken, '/devices', {
        deviceCode: `DEV-NOPERM-${suffix}`,
        deviceName: 'No perm',
        serialNumber: `SN-NOPERM-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      }).expect(403);
    });
  });

  describe('activate / revoke', () => {
    it('revoking sets status REVOKED and writes a DEVICE_REVOKE audit row', async () => {
      const registered = await post(viewerToken, '/devices', {
        deviceCode: `DEV-REV-${suffix}`,
        deviceName: 'To revoke',
        serialNumber: `SN-REV-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      }).expect(201);
      const id = envelope<DeviceRow>(registered).data.id;

      const response = await post(viewerToken, `/devices/${id}/revoke`, { reason: 'Lost' }).expect(
        200,
      );
      expect(envelope<DeviceRow>(response).data.status).toBe('REVOKED');

      const rows = await auditFor(id, AUDIT_ACTIONS.DEVICE_REVOKE);
      expect(rows).toHaveLength(1);
    });

    it('activating a revoked device sets status ACTIVE and writes a DEVICE_BIND audit row', async () => {
      const registered = await post(viewerToken, '/devices', {
        deviceCode: `DEV-ACT-${suffix}`,
        deviceName: 'To reactivate',
        serialNumber: `SN-ACT-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      }).expect(201);
      const id = envelope<DeviceRow>(registered).data.id;
      await post(viewerToken, `/devices/${id}/revoke`).expect(200);

      const response = await post(viewerToken, `/devices/${id}/activate`).expect(200);
      expect(envelope<DeviceRow>(response).data.status).toBe('ACTIVE');

      const rows = await auditFor(id, AUDIT_ACTIONS.DEVICE_BIND);
      // One from register, one from this activate.
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });

    it('refuses revoking a device outside the caller factory scope', async () => {
      await post(viewerToken, `/devices/${otherDeviceId}/revoke`).expect(403);
    });
  });

  describe('reassign', () => {
    it('moves the device to a new trolley/factory and writes a DEVICE_BIND audit row', async () => {
      const registered = await post(viewerToken, '/devices', {
        deviceCode: `DEV-REA-${suffix}`,
        deviceName: 'To reassign',
        serialNumber: `SN-REA-${suffix}`,
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyAId,
      }).expect(201);
      const id = envelope<DeviceRow>(registered).data.id;

      const response = await post(viewerToken, `/devices/${id}/reassign`, {
        factoryId: homeFactoryId,
        trolleyId: homeTrolleyBId,
      }).expect(200);
      const row = envelope<DeviceRow>(response).data;
      expect(row.trolleyId).toBe(homeTrolleyBId);

      const rows = await auditFor(id, AUDIT_ACTIONS.DEVICE_BIND);
      const last = rows.at(-1) as { afterData: unknown };
      expect(last.afterData).toMatchObject({ trolleyId: homeTrolleyBId, factoryId: homeFactoryId });
    });

    it('rejects a target trolleyId that does not belong to the target factoryId with 400', async () => {
      await post(viewerToken, `/devices/${seededDeviceAId}/reassign`, {
        factoryId: homeFactoryId,
        trolleyId: otherTrolleyId,
      }).expect(400);
    });

    it('refuses reassigning to a factory outside the caller scope', async () => {
      await post(viewerToken, `/devices/${seededDeviceAId}/reassign`, {
        factoryId: otherFactoryId,
        trolleyId: otherTrolleyId,
      }).expect(403);
    });
  });

  describe('heartbeat', () => {
    it('exposes no /devices/:id/heartbeat route — mobile/Flutter surface only, never WebApps', async () => {
      await post(viewerToken, `/devices/${seededDeviceAId}/heartbeat`).expect(404);
    });
  });

  describe('pagination', () => {
    it('caps an oversized pageSize', async () => {
      const response = await get(viewerToken, '/devices?pageSize=5000').expect(200);
      expect(envelope<DeviceRow[]>(response).meta.pageSize).toBe(100);
    });

    it('rejects a page below one', async () => {
      await get(viewerToken, '/devices?page=0').expect(400);
    });
  });
});
