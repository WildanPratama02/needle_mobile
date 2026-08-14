import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

interface TokenPairBody {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginBody extends TokenPairBody {
  user: { id: string; username: string; name: string; roles: string[] };
}

interface MeBody {
  id: string;
  username: string;
  name: string;
  roles: string[];
  permissions: string[];
  factoryIds: string[];
  locationIds: string[];
}

/** supertest types `body` as `any`; narrow it once here rather than at each use. */
function bodyOf<T>(response: { body: unknown }): T {
  // Every response is wrapped in the Docs/12 §7 envelope; tests assert on the payload.
  return (response.body as { data: T }).data;
}

/**
 * Runs against the real PostgreSQL from docker-compose — the point is to prove
 * the guards, Prisma layer and token rotation work together, which a mocked
 * database cannot show.
 *
 * Fixtures are namespaced with a unique suffix and torn down afterwards, so
 * this coexists with seeded data instead of truncating the developer's tables.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const username = `e2e_pic_${suffix}`;
  const password = 'E2ePassword1!';
  const roleCode = `E2E_PIC_${suffix}`.toUpperCase();

  let userId: string;
  // Taken from the seeded master data — `user_factory_scopes.factory_id` gained
  // a real foreign key in issue 03, so an invented UUID no longer inserts.
  let factoryId: string;

  beforeAll(async () => {
    app = await createTestApp();

    prisma = app.get(PrismaService);

    factoryId = (await prisma.factory.findFirstOrThrow()).id;

    const permission = await prisma.permission.upsert({
      where: { code: PERMISSIONS.EXCHANGE_CREATE },
      update: {},
      create: { code: PERMISSIONS.EXCHANGE_CREATE, name: 'Exchange create' },
    });

    const role = await prisma.role.create({
      data: {
        code: roleCode,
        name: 'E2E PIC',
        permissions: { create: [{ permissionId: permission.id }] },
      },
    });

    const user = await prisma.user.create({
      data: {
        username,
        name: 'E2E PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: role.id }] },
        factoryScopes: { create: [{ factoryId }] },
      },
    });

    userId = user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { username } });
      await prisma.role.deleteMany({ where: { code: roleCode } });
    }
    await app?.close();
  });

  const server = () => app.getHttpServer() as Server;

  const login = async (): Promise<LoginBody> => {
    const response = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);

    return bodyOf<LoginBody>(response);
  };

  describe('POST /api/v1/auth/login', () => {
    it('returns a token pair and the user summary', async () => {
      const body = await login();

      expect(body.expiresIn).toEqual(expect.any(Number));
      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.refreshToken).toEqual(expect.any(String));
      expect(body.user).toMatchObject({ id: userId, username, roles: [roleCode] });
    });

    it('rejects a wrong password with 401', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({ username, password: 'nope' })
        .expect(401);
    });

    it('rejects an unknown username with 401', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({ username: 'no_such_user', password })
        .expect(401);
    });

    it('rejects a malformed body with 400', async () => {
      await request(server()).post('/api/v1/auth/login').send({ username }).expect(400);
    });

    it('rejects a user deactivated after creation', async () => {
      await prisma.user.update({ where: { id: userId }, data: { status: 'INACTIVE' } });

      await request(server()).post('/api/v1/auth/login').send({ username, password }).expect(401);

      await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('rejects a request with no token', async () => {
      await request(server()).get('/api/v1/auth/me').expect(401);
    });

    it('rejects a garbage token', async () => {
      await request(server())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
    });

    it('returns roles, permissions and scopes for a valid token', async () => {
      const { accessToken } = await login();

      const response = await request(server())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(bodyOf<MeBody>(response)).toMatchObject({
        id: userId,
        username,
        roles: [roleCode],
        permissions: [PERMISSIONS.EXCHANGE_CREATE],
        factoryIds: [factoryId],
        locationIds: [],
      });
    });

    // Permissions are read per request, so a revoked grant bites immediately
    // rather than when the access token happens to expire.
    it('reflects a permission revoked after the token was issued', async () => {
      const { accessToken } = await login();

      const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

      const response = await request(server())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(bodyOf<MeBody>(response).permissions).toEqual([]);

      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: PERMISSIONS.EXCHANGE_CREATE },
      });
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('rotates into a new pair and invalidates the old token', async () => {
      const first = await login();

      const response = await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(200);

      const rotated = bodyOf<TokenPairBody>(response);
      expect(rotated.refreshToken).not.toBe(first.refreshToken);
      expect(rotated.accessToken).toEqual(expect.any(String));

      // Reuse of the consumed token is refused.
      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(401);
    });

    it('rejects an unknown refresh token', async () => {
      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'deadbeef' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the refresh token', async () => {
      const { refreshToken } = await login();

      await request(server()).post('/api/v1/auth/logout').send({ refreshToken }).expect(204);

      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    });
  });
});
