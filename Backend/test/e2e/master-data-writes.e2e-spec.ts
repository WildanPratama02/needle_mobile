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
  meta: { requestId: string };
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * The write side of `.scratch/master-data-storage-rfid/spec.md`: StorageMapping
 * create/update, Employee create/update (including the inline RFID scan and
 * the deactivate cascade), RFID Card enroll/revoke. Asserted at the HTTP
 * boundary, same style as `master-data-query.e2e-spec.ts`.
 */
describe('Master data writes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const editorUsername = `e2e_mdw_editor_${suffix}`;
  const viewerUsername = `e2e_mdw_viewer_${suffix}`;
  const editorRoleCode = `E2E_MDW_EDIT_${suffix}`.toUpperCase();
  const viewerRoleCode = `E2E_MDW_VIEW_${suffix}`.toUpperCase();

  let editorToken: string;
  let viewerToken: string;

  let factoryId: string;
  let trolleyId: string;
  let storageLocationId: string;
  let otherStorageLocationId: string;
  let warehouseLocationId: string;
  let exchangeTypeId: string;

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
  const post = (token: string, path: string, body: object) =>
    as(token)(request(server()).post(`/api/v1${path}`).send(body));
  const patch = (token: string, path: string, body: object) =>
    as(token)(request(server()).patch(`/api/v1${path}`).send(body));

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const factory = await prisma.factory.create({
      data: { code: `FAC-MDW-${suffix}`, name: 'MDW factory', timezone: 'Asia/Jakarta' },
    });
    factoryId = factory.id;

    const trolleyLocation = await prisma.location.create({
      data: { factoryId, code: `LOC-MDW-TRL-${suffix}`, name: 'MDW trolley location', locationType: 'TROLLEY' },
    });
    const trolley = await prisma.trolley.create({
      data: { factoryId, locationId: trolleyLocation.id, code: `TRL-MDW-${suffix}`, name: 'MDW trolley' },
    });
    trolleyId = trolley.id;

    const storageLocation = await prisma.location.create({
      data: {
        factoryId,
        code: `LOC-MDW-STG-${suffix}`,
        name: 'MDW storage location',
        locationType: 'USED_NEEDLE_STORAGE',
      },
    });
    storageLocationId = storageLocation.id;

    const otherStorageLocation = await prisma.location.create({
      data: {
        factoryId,
        code: `LOC-MDW-STG2-${suffix}`,
        name: 'MDW second storage location',
        locationType: 'USED_NEEDLE_STORAGE',
      },
    });
    otherStorageLocationId = otherStorageLocation.id;

    const warehouseLocation = await prisma.location.create({
      data: { factoryId, code: `LOC-MDW-WH-${suffix}`, name: 'MDW warehouse', locationType: 'WAREHOUSE' },
    });
    warehouseLocationId = warehouseLocation.id;

    const exchangeType = await prisma.exchangeType.findFirstOrThrow({ where: { code: 'BROKEN' } });
    exchangeTypeId = exchangeType.id;

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const editPermissions = await permissionFor([PERMISSIONS.MASTER_VIEW, PERMISSIONS.MASTER_EDIT]);
    const viewPermissions = await permissionFor([PERMISSIONS.MASTER_VIEW]);

    const editorRole = await prisma.role.create({
      data: {
        code: editorRoleCode,
        name: 'E2E master-data editor',
        permissions: { create: editPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E master-data viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: editorUsername,
        name: 'E2E MDW Editor',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: editorRole.id }] },
        factoryScopes: { create: [{ factoryId }] },
      },
    });

    await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E MDW Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId }] },
      },
    });

    editorToken = await login(editorUsername);
    viewerToken = await login(viewerUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [editorUsername, viewerUsername] } },
        select: { id: true },
      });
      await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
      await prisma.role.deleteMany({ where: { code: { in: [editorRoleCode, viewerRoleCode] } } });
      await prisma.rfidCard.deleteMany({ where: { employee: { factoryId } } });
      await prisma.employee.deleteMany({ where: { factoryId } });
      await prisma.storageMapping.deleteMany({ where: { trolleyId } });
      await prisma.trolley.deleteMany({ where: { factoryId } });
      await prisma.location.deleteMany({ where: { factoryId } });
      await prisma.factory.deleteMany({ where: { id: factoryId } });
    }
    await app?.close();
  });

  describe('StorageMapping', () => {
    let mappingId: string;

    it('rejects create without MASTER_EDIT', async () => {
      await post(viewerToken, '/storage-mappings', {
        trolleyId,
        exchangeTypeId,
        storageLocationId,
      }).expect(403);
    });

    it('rejects a destination location that is not USED_NEEDLE_STORAGE', async () => {
      await post(editorToken, '/storage-mappings', {
        trolleyId,
        exchangeTypeId,
        storageLocationId: warehouseLocationId,
      }).expect(400);
    });

    it('creates a mapping for a valid trolley + exchange type + USED_NEEDLE_STORAGE destination', async () => {
      const response = await post(editorToken, '/storage-mappings', {
        trolleyId,
        exchangeTypeId,
        storageLocationId,
      }).expect(201);

      const row = envelope<{ id: string; trolleyId: string; storageLocationId: string }>(response).data;
      expect(row.trolleyId).toBe(trolleyId);
      expect(row.storageLocationId).toBe(storageLocationId);
      mappingId = row.id;
    });

    it('rejects a duplicate (trolleyId, exchangeTypeId) pair with 409', async () => {
      await post(editorToken, '/storage-mappings', {
        trolleyId,
        exchangeTypeId,
        storageLocationId: otherStorageLocationId,
      }).expect(409);
    });

    it('updates only the destination location', async () => {
      const response = await patch(editorToken, `/storage-mappings/${mappingId}`, {
        storageLocationId: otherStorageLocationId,
      }).expect(200);

      const row = envelope<{ trolleyId: string; storageLocationId: string }>(response).data;
      expect(row.trolleyId).toBe(trolleyId);
      expect(row.storageLocationId).toBe(otherStorageLocationId);
    });
  });

  describe('Employee', () => {
    it('rejects create without MASTER_EDIT', async () => {
      await post(viewerToken, '/employees', {
        employeeNumber: `EMP-MDW-${suffix}-X`,
        name: 'Should Not Create',
        factoryId,
      }).expect(403);
    });

    it('creates an employee without a card when rfidUid is omitted', async () => {
      const response = await post(editorToken, '/employees', {
        employeeNumber: `EMP-MDW-${suffix}-1`,
        name: 'No Card Employee',
        factoryId,
      }).expect(201);

      const employeeId = envelope<{ id: string }>(response).data.id;
      const cards = await get(editorToken, `/rfid/cards?employeeId=${employeeId}`).expect(200);
      expect(envelope<unknown[]>(cards).data).toEqual([]);
    });

    it('rejects a duplicate employeeNumber with 409', async () => {
      const employeeNumber = `EMP-MDW-${suffix}-2`;
      await post(editorToken, '/employees', { employeeNumber, name: 'First', factoryId }).expect(201);

      await post(editorToken, '/employees', { employeeNumber, name: 'Second', factoryId }).expect(409);
    });

    it('enrolls the inline rfidUid in the same request', async () => {
      const response = await post(editorToken, '/employees', {
        employeeNumber: `EMP-MDW-${suffix}-3`,
        name: 'Card Employee',
        factoryId,
        rfidUid: `RFID-MDW-${suffix}-3`,
      }).expect(201);

      const employeeId = envelope<{ id: string }>(response).data.id;
      const cards = await get(editorToken, `/rfid/cards?employeeId=${employeeId}`).expect(200);
      const rows = envelope<{ status: string; rfidUid: string }[]>(cards).data;
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe('ACTIVE');
      expect(rows[0].rfidUid).toBe(`RFID-MDW-${suffix}-3`);
    });

    it('cascades to revoke the active card when deactivated', async () => {
      const created = await post(editorToken, '/employees', {
        employeeNumber: `EMP-MDW-${suffix}-4`,
        name: 'To Be Deactivated',
        factoryId,
        rfidUid: `RFID-MDW-${suffix}-4`,
      }).expect(201);
      const employeeId = envelope<{ id: string }>(created).data.id;

      await patch(editorToken, `/employees/${employeeId}`, { status: 'INACTIVE' }).expect(200);

      const cards = await get(editorToken, `/rfid/cards?employeeId=${employeeId}`).expect(200);
      const rows = envelope<{ status: string }[]>(cards).data;
      expect(rows[0].status).toBe('INACTIVE');
    });
  });

  describe('RFID Card', () => {
    let employeeAId: string;
    let employeeBId: string;

    beforeAll(async () => {
      const a = await post(editorToken, '/employees', {
        employeeNumber: `EMP-MDW-${suffix}-RA`,
        name: 'RFID Employee A',
        factoryId,
      }).expect(201);
      employeeAId = envelope<{ id: string }>(a).data.id;

      const b = await post(editorToken, '/employees', {
        employeeNumber: `EMP-MDW-${suffix}-RB`,
        name: 'RFID Employee B',
        factoryId,
      }).expect(201);
      employeeBId = envelope<{ id: string }>(b).data.id;
    });

    it('rejects enroll without MASTER_EDIT', async () => {
      await post(viewerToken, '/rfid/cards', {
        employeeId: employeeAId,
        rfidUid: `RFID-MDW-${suffix}-A`,
      }).expect(403);
    });

    it('enrolls a card for an employee', async () => {
      const response = await post(editorToken, '/rfid/cards', {
        employeeId: employeeAId,
        rfidUid: `RFID-MDW-${suffix}-A`,
      }).expect(201);

      expect(envelope<{ status: string }>(response).data.status).toBe('ACTIVE');
    });

    it('rejects a UID already ACTIVE on another employee with 409', async () => {
      await post(editorToken, '/rfid/cards', {
        employeeId: employeeBId,
        rfidUid: `RFID-MDW-${suffix}-A`,
      }).expect(409);
    });

    it('auto-revokes the employee\'s previous active card when enrolling a new one', async () => {
      await post(editorToken, '/rfid/cards', {
        employeeId: employeeAId,
        rfidUid: `RFID-MDW-${suffix}-A2`,
      }).expect(201);

      const cards = await get(editorToken, `/rfid/cards?employeeId=${employeeAId}`).expect(200);
      const rows = envelope<{ rfidUid: string; status: string }[]>(cards).data;
      const first = rows.find((row) => row.rfidUid === `RFID-MDW-${suffix}-A`);
      const second = rows.find((row) => row.rfidUid === `RFID-MDW-${suffix}-A2`);
      expect(first?.status).toBe('INACTIVE');
      expect(second?.status).toBe('ACTIVE');
    });

    it('lets the original UID be re-enrolled elsewhere now that it is revoked', async () => {
      await post(editorToken, '/rfid/cards', {
        employeeId: employeeBId,
        rfidUid: `RFID-MDW-${suffix}-A`,
      }).expect(201);
    });

    it('revokes a card, terminal — a second revoke rejects with 409', async () => {
      const list = await get(editorToken, `/rfid/cards?employeeId=${employeeBId}`).expect(200);
      const active = envelope<{ id: string; status: string }[]>(list).data.find(
        (row) => row.status === 'ACTIVE',
      )!;

      await post(editorToken, `/rfid/cards/${active.id}/revoke`, {}).expect(200);
      await post(editorToken, `/rfid/cards/${active.id}/revoke`, {}).expect(409);
    });
  });
});
