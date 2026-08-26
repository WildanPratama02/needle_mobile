import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
import { ALL_PERMISSIONS, PERMISSIONS } from '../../src/shared/constants/permissions';
import { ROLE_PERMISSIONS, ROLES } from '../../src/shared/constants/roles';
import { createTestApp } from './create-test-app';

interface Envelope<T> {
  success: boolean;
  data: T;
  meta: { requestId: string };
}

interface RoleRow {
  code: string;
  permissionCodes: string[];
  memberCount: number;
}

interface PermissionRow {
  code: string;
}

interface UserRow {
  id: string;
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;
const sorted = (values: string[]) => [...values].sort();

/**
 * `/roles` and `/permissions` read-only catalogue (`.scratch/roles-permissions/spec.md`),
 * plus `/users?role=` (the one addition it makes to GAP-06's endpoint).
 *
 * Same shape as `users-query.e2e-spec.ts`: assert what a caller can
 * observe at the HTTP boundary — never a service's internal query.
 */
describe('Roles and permissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const viewerUsername = `e2e_role_viewer_${suffix}`;
  const nopermUsername = `e2e_role_noperm_${suffix}`;
  const subjectHomeUsername1 = `e2e_role_subj_home1_${suffix}`;
  const subjectHomeUsername2 = `e2e_role_subj_home2_${suffix}`;
  const subjectOtherUsername = `e2e_role_subj_other_${suffix}`;
  const viewerRoleCode = `E2E_ROLE_VIEW_${suffix}`.toUpperCase();
  const nopermRoleCode = `E2E_ROLE_NONE_${suffix}`.toUpperCase();

  let viewerToken: string;
  let nopermToken: string;

  let homeFactoryId: string;
  let otherFactoryId: string;
  let baselinePicTroliInHome: number;
  let subjectHomeUserId1: string;
  let subjectHomeUserId2: string;
  let subjectOtherUserId: string;
  const createdUserIds: string[] = [];

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

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const seededTrolley = await prisma.trolley.findFirstOrThrow();
    homeFactoryId = seededTrolley.factoryId;

    const other = await prisma.factory.create({
      data: {
        code: `FAC-ROLE-${suffix}`,
        name: 'Roles e2e other factory',
        timezone: 'Asia/Jakarta',
      },
    });
    otherFactoryId = other.id;

    const permissionFor = (codes: string[]) =>
      Promise.all(
        codes.map((code) =>
          prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
        ),
      );

    const viewPermissions = await permissionFor([PERMISSIONS.USER_MANAGE]);
    const otherPermissions = await permissionFor([PERMISSIONS.EXCHANGE_VIEW]);

    const viewerRole = await prisma.role.create({
      data: {
        code: viewerRoleCode,
        name: 'E2E roles viewer',
        permissions: { create: viewPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    const nopermRole = await prisma.role.create({
      data: {
        code: nopermRoleCode,
        name: 'E2E no user-manage',
        permissions: { create: otherPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    // Reuse the seeded PIC_TROLI role (identity.seed.ts) rather than
    // inventing a new one — `role=<code>` only accepts the five canonical
    // ROLES codes, so member-count/filter assertions need a real one.
    const picTroliRole = await prisma.role.findUniqueOrThrow({
      where: { code: ROLES.PIC_TROLI },
    });

    // Baseline before this suite adds its own PIC_TROLI holders — other
    // seed data or suites may already have PIC_TROLI users in homeFactory,
    // so assertions below are relative deltas, never an absolute count.
    baselinePicTroliInHome = await prisma.user.count({
      where: {
        roles: { some: { roleId: picTroliRole.id } },
        factoryScopes: { some: { factoryId: homeFactoryId } },
      },
    });

    const viewerUser = await prisma.user.create({
      data: {
        username: viewerUsername,
        name: 'E2E Roles Viewer',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: viewerRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    const nopermUser = await prisma.user.create({
      data: {
        username: nopermUsername,
        name: 'E2E Roles No Permission',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: nopermRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    const subjectHome1 = await prisma.user.create({
      data: {
        username: subjectHomeUsername1,
        name: 'E2E Roles Subject Home 1',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: picTroliRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    const subjectHome2 = await prisma.user.create({
      data: {
        username: subjectHomeUsername2,
        name: 'E2E Roles Subject Home 2',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: picTroliRole.id }] },
        factoryScopes: { create: [{ factoryId: homeFactoryId }] },
      },
    });
    const subjectOther = await prisma.user.create({
      data: {
        username: subjectOtherUsername,
        name: 'E2E Roles Subject Other',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: picTroliRole.id }] },
        factoryScopes: { create: [{ factoryId: otherFactoryId }] },
      },
    });

    subjectHomeUserId1 = subjectHome1.id;
    subjectHomeUserId2 = subjectHome2.id;
    subjectOtherUserId = subjectOther.id;
    createdUserIds.push(
      viewerUser.id,
      nopermUser.id,
      subjectHome1.id,
      subjectHome2.id,
      subjectOther.id,
    );

    viewerToken = await login(viewerUsername);
    nopermToken = await login(nopermUsername);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.role.deleteMany({ where: { code: { in: [viewerRoleCode, nopermRoleCode] } } });
      await prisma.factory.deleteMany({ where: { id: otherFactoryId } });
    }
    await app?.close();
  });

  describe('GET /roles', () => {
    it('returns exactly the five seeded roles with their declared permission sets', async () => {
      const response = await get(viewerToken, '/roles').expect(200);
      const rows = envelope<RoleRow[]>(response).data;

      expect(sorted(rows.map((row) => row.code))).toEqual(sorted(Object.values(ROLES)));
      for (const row of rows) {
        expect(sorted(row.permissionCodes)).toEqual(
          sorted(ROLE_PERMISSIONS[row.code as keyof typeof ROLE_PERMISSIONS]),
        );
      }
    });

    it("scopes memberCount to the caller's factory, narrowing not widening", async () => {
      const response = await get(viewerToken, '/roles').expect(200);
      const row = envelope<RoleRow[]>(response).data.find((r) => r.code === ROLES.PIC_TROLI);

      // Two new PIC_TROLI holders were added in homeFactory, one in
      // otherFactory — the viewer (scoped to homeFactory only) must see the
      // former, never the latter.
      expect(row?.memberCount).toBe(baselinePicTroliInHome + 2);
    });

    it('rejects a caller without USER_MANAGE', async () => {
      const response = await get(nopermToken, '/roles').expect(403);
      expect(envelope<unknown>(response).success).toBe(false);
    });

    it('rejects an unauthenticated request', async () => {
      await request(server()).get('/api/v1/roles').expect(401);
    });

    it.each(['post', 'put', 'patch', 'delete'] as const)(
      'exposes no %s route on /roles',
      async (method) => {
        await as(viewerToken)(request(server())[method]('/api/v1/roles')).expect(404);
      },
    );
  });

  describe('GET /permissions', () => {
    it('returns exactly the full permission catalogue', async () => {
      const response = await get(viewerToken, '/permissions').expect(200);
      const codes = envelope<PermissionRow[]>(response).data.map((row) => row.code);

      expect(sorted(codes)).toEqual(sorted(ALL_PERMISSIONS));
    });

    it('rejects a caller without USER_MANAGE', async () => {
      await get(nopermToken, '/permissions').expect(403);
    });
  });

  describe('GET /users?role=', () => {
    it('returns only users holding the given role, scoped to the caller factory', async () => {
      const response = await get(viewerToken, `/users?role=${ROLES.PIC_TROLI}&pageSize=100`).expect(
        200,
      );
      const ids = envelope<UserRow[]>(response).data.map((row) => row.id);

      expect(ids).toContain(subjectHomeUserId1);
      expect(ids).toContain(subjectHomeUserId2);
      expect(ids).not.toContain(subjectOtherUserId);
    });

    it('rejects a role value outside the five canonical codes', async () => {
      await get(viewerToken, '/users?role=NOT_A_ROLE').expect(400);
    });
  });
});
