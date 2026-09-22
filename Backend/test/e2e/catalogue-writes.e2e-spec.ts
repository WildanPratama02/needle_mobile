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

interface Row {
  id: string;
  code: string;
  name: string;
  status: string;
}

/**
 * Needle Type / Factory / Trolley writes (`.scratch/admin-panel-crud/issues/01`–`03`),
 * asserted at the HTTP boundary in the style of `master-data-writes.e2e-spec.ts`.
 */
describe('Catalogue writes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const editorUsername = `e2e_cat_editor_${suffix}`;
  const viewerUsername = `e2e_cat_viewer_${suffix}`;
  const editorRoleCode = `E2E_CAT_EDIT_${suffix}`.toUpperCase();
  const viewerRoleCode = `E2E_CAT_VIEW_${suffix}`.toUpperCase();

  let editorToken: string;
  let viewerToken: string;
  let factoryId: string;
  let warehouseLocationId: string;

  const server = () => app.getHttpServer() as Server;
  const as = (token: string) => (req: request.Test) => req.set('Authorization', `Bearer ${token}`);
  const get = (token: string, path: string) => as(token)(request(server()).get(`/api/v1${path}`));
  const post = (token: string, path: string, body: object = {}) =>
    as(token)(request(server()).post(`/api/v1${path}`).send(body));
  const patch = (token: string, path: string, body: object) =>
    as(token)(request(server()).patch(`/api/v1${path}`).send(body));

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

    const factory = await prisma.factory.create({
      data: { code: `FAC-CAT-${suffix}`, name: 'Catalogue e2e factory', timezone: 'Asia/Jakarta' },
    });
    factoryId = factory.id;
    const warehouse = await prisma.location.create({
      data: {
        factoryId,
        code: `LOC-CAT-WH-${suffix}`,
        name: 'CAT warehouse',
        locationType: 'WAREHOUSE',
      },
    });
    warehouseLocationId = warehouse.id;

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
        name: 'E2E catalogue editor',
        permissions: { create: editPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E catalogue viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    for (const [username, roleId] of [
      [editorUsername, editorRole.id],
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

    editorToken = await login(editorUsername);
    viewerToken = await login(viewerUsername);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { username: { in: [editorUsername, viewerUsername] } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      const factories = await prisma.factory.findMany({
        where: { code: { contains: suffix } },
        select: { id: true },
      });
      const factoryIds = factories.map((f) => f.id);

      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [editorRoleCode, viewerRoleCode] } } });
      await prisma.storageMapping.deleteMany({
        where: { trolley: { factoryId: { in: factoryIds } } },
      });
      await prisma.trolley.deleteMany({ where: { factoryId: { in: factoryIds } } });
      await prisma.location.deleteMany({ where: { factoryId: { in: factoryIds } } });
      await prisma.needleType.deleteMany({ where: { code: { contains: suffix.toUpperCase() } } });
      await prisma.factory.deleteMany({ where: { id: { in: factoryIds } } });
    }
    await app?.close();
  });

  describe('Needle Type', () => {
    const code = `NT-${suffix}`.toUpperCase();
    let needleTypeId: string;

    it('rejects create without MASTER_EDIT', async () => {
      await post(viewerToken, '/needle-types', {
        code,
        name: 'x',
        unit: 'PCS',
        minimumStock: 1,
      }).expect(403);
    });

    it('creates a needle type', async () => {
      const response = await post(editorToken, '/needle-types', {
        code,
        name: 'E2E needle',
        category: 'Sewing',
        unit: 'PCS',
        minimumStock: 50,
      }).expect(201);

      const row = envelope<Row & { minimumStock: number }>(response).data;
      expect(row).toEqual(expect.objectContaining({ code, status: 'ACTIVE', minimumStock: 50 }));
      needleTypeId = row.id;
    });

    it('rejects a duplicate code with 409', async () => {
      await post(editorToken, '/needle-types', {
        code,
        name: 'dup',
        unit: 'PCS',
        minimumStock: 0,
      }).expect(409);
    });

    it('rejects a negative minimumStock with 400', async () => {
      await post(editorToken, '/needle-types', {
        code: `${code}-NEG`,
        name: 'neg',
        unit: 'PCS',
        minimumStock: -1,
      }).expect(400);
    });

    it('edits without touching the code', async () => {
      const response = await patch(editorToken, `/needle-types/${needleTypeId}`, {
        name: 'Renamed needle',
        minimumStock: 10,
      }).expect(200);

      const row = envelope<Row & { minimumStock: number }>(response).data;
      expect(row).toEqual(
        expect.objectContaining({ code, name: 'Renamed needle', minimumStock: 10 }),
      );
    });

    it('deactivates, dropping it from the active-only list, then activates again', async () => {
      await post(editorToken, `/needle-types/${needleTypeId}/deactivate`).expect(200);

      const active = await get(editorToken, '/needle-types?status=ACTIVE&pageSize=100').expect(200);
      expect(envelope<Row[]>(active).data.map((row) => row.id)).not.toContain(needleTypeId);

      const reactivated = await post(editorToken, `/needle-types/${needleTypeId}/activate`).expect(
        200,
      );
      expect(envelope<Row>(reactivated).data.status).toBe('ACTIVE');
    });
  });

  describe('Factory', () => {
    const code = `FAC-NEW-${suffix}`;
    let newFactoryId: string;

    it('rejects create without MASTER_EDIT', async () => {
      await post(viewerToken, '/factories', { code, name: 'x', timezone: 'Asia/Jakarta' }).expect(
        403,
      );
    });

    it('rejects an invalid timezone with 400', async () => {
      await post(editorToken, '/factories', { code, name: 'x', timezone: 'Mars/Olympus' }).expect(
        400,
      );
    });

    it('creates a factory the creator can immediately see', async () => {
      const response = await post(editorToken, '/factories', {
        code,
        name: 'E2E new factory',
        timezone: 'Asia/Jakarta',
      }).expect(201);
      newFactoryId = envelope<Row>(response).data.id;

      await get(editorToken, `/factories/${newFactoryId}`).expect(200);
    });

    it('rejects a duplicate code with 409', async () => {
      await post(editorToken, '/factories', { code, name: 'dup', timezone: 'Asia/Jakarta' }).expect(
        409,
      );
    });

    it('refuses to edit a factory outside the caller scope', async () => {
      await patch(viewerToken, `/factories/${newFactoryId}`, { name: 'x' }).expect(403);
    });

    it('edits name and timezone', async () => {
      const response = await patch(editorToken, `/factories/${newFactoryId}`, {
        name: 'Renamed factory',
        timezone: 'Asia/Makassar',
      }).expect(200);

      expect(envelope<Row & { timezone: string }>(response).data).toEqual(
        expect.objectContaining({ code, name: 'Renamed factory', timezone: 'Asia/Makassar' }),
      );
    });

    it('deactivates — and an inactive factory takes no new trolley', async () => {
      const response = await post(editorToken, `/factories/${newFactoryId}/deactivate`).expect(200);
      expect(envelope<Row>(response).data.status).toBe('INACTIVE');

      await post(editorToken, '/trolleys', {
        factoryId: newFactoryId,
        code: `TR-INACTIVE-${suffix}`,
        name: 'Should not create',
      }).expect(400);

      await post(editorToken, `/factories/${newFactoryId}/activate`).expect(200);
    });
  });

  describe('Trolley', () => {
    const code = `TR-${suffix}`;
    let trolleyId: string;

    it('creates a trolley together with its own TROLLEY location', async () => {
      const response = await post(editorToken, '/trolleys', {
        factoryId,
        code,
        name: 'E2E trolley',
      }).expect(201);

      const row = envelope<Row & { factoryId: string; locationId: string }>(response).data;
      trolleyId = row.id;
      expect(row.factoryId).toBe(factoryId);

      const location = await prisma.location.findUniqueOrThrow({ where: { id: row.locationId } });
      expect(location.locationType).toBe('TROLLEY');
      expect(location.factoryId).toBe(factoryId);
    });

    it('rejects a duplicate code with 409', async () => {
      await post(editorToken, '/trolleys', { factoryId, code, name: 'dup' }).expect(409);
    });

    it('changes status through PATCH', async () => {
      const response = await patch(editorToken, `/trolleys/${trolleyId}`, {
        name: 'Renamed trolley',
        status: 'INACTIVE',
      }).expect(200);

      expect(envelope<Row>(response).data).toEqual(
        expect.objectContaining({ code, name: 'Renamed trolley', status: 'INACTIVE' }),
      );
    });

    it('rejects moving the trolley onto a non-TROLLEY location', async () => {
      await patch(editorToken, `/trolleys/${trolleyId}`, {
        locationId: warehouseLocationId,
      }).expect(400);
    });
  });

  describe('Location', () => {
    const code = `UNS-${suffix}`;
    let storageLocationId: string;

    it('rejects create without MASTER_EDIT', async () => {
      await post(viewerToken, '/locations', {
        factoryId,
        code,
        name: 'x',
        locationType: 'USED_NEEDLE_STORAGE',
      }).expect(403);
    });

    it('creates a used-needle storage location under the warehouse', async () => {
      const response = await post(editorToken, '/locations', {
        factoryId,
        parentLocationId: warehouseLocationId,
        code,
        name: 'E2E storage',
        locationType: 'USED_NEEDLE_STORAGE',
      }).expect(201);

      const row = envelope<Row & { locationType: string; parentLocationId: string }>(response).data;
      expect(row).toEqual(
        expect.objectContaining({
          code,
          status: 'ACTIVE',
          locationType: 'USED_NEEDLE_STORAGE',
          parentLocationId: warehouseLocationId,
        }),
      );
      storageLocationId = row.id;
    });

    it('rejects a duplicate code in the same factory with 409', async () => {
      await post(editorToken, '/locations', {
        factoryId,
        code,
        name: 'dup',
        locationType: 'WAREHOUSE',
      }).expect(409);
    });

    it('refuses to create a bare TROLLEY location', async () => {
      await post(editorToken, '/locations', {
        factoryId,
        code: `TRL-BARE-${suffix}`,
        name: 'x',
        locationType: 'TROLLEY',
      }).expect(400);
    });

    it('rejects a parent that is not a WAREHOUSE', async () => {
      await post(editorToken, '/locations', {
        factoryId,
        parentLocationId: storageLocationId,
        code: `UNS-CHILD-${suffix}`,
        name: 'x',
        locationType: 'USED_NEEDLE_STORAGE',
      }).expect(400);
    });

    it('edits name and detaches the parent', async () => {
      const response = await patch(editorToken, `/locations/${storageLocationId}`, {
        name: 'Renamed storage',
        parentLocationId: null,
      }).expect(200);

      expect(envelope<Row & { parentLocationId: string | null }>(response).data).toEqual(
        expect.objectContaining({ code, name: 'Renamed storage', parentLocationId: null }),
      );
    });

    it('refuses to deactivate a storage location an active mapping still targets', async () => {
      const trolley = await post(editorToken, '/trolleys', {
        factoryId,
        code: `TR-LOC-${suffix}`,
        name: 'Location e2e trolley',
      }).expect(201);
      const exchangeType = await prisma.exchangeType.findFirstOrThrow({
        where: { status: 'ACTIVE' },
      });
      await post(editorToken, '/storage-mappings', {
        trolleyId: envelope<Row>(trolley).data.id,
        exchangeTypeId: exchangeType.id,
        storageLocationId,
      }).expect(201);

      await patch(editorToken, `/locations/${storageLocationId}`, { status: 'INACTIVE' }).expect(
        409,
      );
    });
  });

  it('audits every catalogue write under CHANGE_MASTER', async () => {
    const editor = await prisma.user.findUniqueOrThrow({ where: { username: editorUsername } });
    const rows = await prisma.auditLog.findMany({
      where: { actorUserId: editor.id, action: 'CHANGE_MASTER' },
      select: { entityType: true },
    });
    const types = new Set(rows.map((row) => row.entityType));
    expect(types).toEqual(
      new Set(['NeedleType', 'Factory', 'Trolley', 'Location', 'StorageMapping']),
    );
  });
});
