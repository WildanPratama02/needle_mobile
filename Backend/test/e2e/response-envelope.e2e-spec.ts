import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

interface Envelope {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string; details: string[] };
  meta: {
    requestId: string;
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

const envelope = (response: { body: unknown }) => response.body as Envelope;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The response contract from `Docs/12` §7, asserted directly rather than
 * through the payload helpers the other suites use.
 */
describe('Response envelope (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const username = `e2e_env_${suffix}`;
  const password = 'E2ePassword1!';
  const roleCode = `E2E_ENV_${suffix}`.toUpperCase();

  let token: string;
  let factoryId: string;

  const server = () => app.getHttpServer() as Server;

  beforeAll(async () => {
    app = await createTestApp();

    prisma = app.get(PrismaService);
    factoryId = (await prisma.factory.findFirstOrThrow()).id;

    const permissions = await Promise.all(
      [PERMISSIONS.EXCHANGE_VIEW, PERMISSIONS.EXCHANGE_CREATE].map((code) =>
        prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
      ),
    );
    const role = await prisma.role.create({
      data: {
        code: roleCode,
        name: 'E2E envelope',
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
    });
    await prisma.user.create({
      data: {
        username,
        name: 'E2E Envelope',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: role.id }] },
        factoryScopes: { create: [{ factoryId }] },
      },
    });

    const login = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);
    token = (envelope(login).data as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { username } });

      if (user) {
        await prisma.exchange.deleteMany({ where: { picUserId: user.id } });
      }

      await prisma.user.deleteMany({ where: { username } });
      await prisma.role.deleteMany({ where: { code: roleCode } });
    }
    await app?.close();
  });

  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  describe('success', () => {
    it('wraps a single resource in { success, data, meta }', async () => {
      const response = await auth(request(server()).get('/api/v1/auth/me')).expect(200);
      const body = envelope(response);

      expect(body.success).toBe(true);
      expect(body.data).toEqual(expect.objectContaining({ username }));
      expect(body.meta.requestId).toEqual(expect.any(String));
    });

    it('generates a requestId when the client sends none', async () => {
      const response = await auth(request(server()).get('/api/v1/auth/me')).expect(200);

      expect(envelope(response).meta.requestId).toMatch(UUID);
    });

    // Docs/12 §5: a client-supplied X-Request-ID is the correlation handle.
    it('echoes a client-supplied X-Request-ID in meta and in the header', async () => {
      const response = await auth(request(server()).get('/api/v1/auth/me'))
        .set('X-Request-ID', `trace-${suffix}`)
        .expect(200);

      expect(envelope(response).meta.requestId).toBe(`trace-${suffix}`);
      expect(response.headers['x-request-id']).toBe(`trace-${suffix}`);
    });

    it('puts rows in data and counters in meta for a paginated route', async () => {
      const response = await auth(request(server()).get('/api/v1/exchanges')).expect(200);
      const body = envelope(response);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
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

    it('computes totalPages from total and pageSize', async () => {
      const response = await auth(request(server()).get('/api/v1/exchanges?pageSize=1')).expect(
        200,
      );
      const { total, pageSize, totalPages } = envelope(response).meta;

      expect(totalPages).toBe(Math.ceil((total ?? 0) / (pageSize ?? 1)));
    });

    // Docs/12 §8: 204 is "success without body", so it must stay bodiless.
    it('leaves a 204 without a body', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ username, password })
        .expect(200);
      const { refreshToken } = envelope(login).data as { refreshToken: string };

      const response = await request(server())
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe('errors', () => {
    it('wraps a 404 in { success: false, error, meta }', async () => {
      const response = await auth(
        request(server()).get('/api/v1/exchanges/00000000-0000-0000-0000-000000000000'),
      ).expect(404);
      const body = envelope(response);

      expect(body.success).toBe(false);
      expect(body.error).toEqual(
        expect.objectContaining({ code: 'NOT_FOUND', message: expect.any(String) as string }),
      );
      expect(body.meta.requestId).toEqual(expect.any(String));
      expect(body).not.toHaveProperty('data');
    });

    it('reports field errors as details on a 400', async () => {
      const response = await request(server())
        .post('/api/v1/auth/login')
        .send({ username })
        .expect(400);
      const body = envelope(response);

      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('VALIDATION_ERROR');
      expect(body.error?.details.length).toBeGreaterThan(0);
      expect(body.error?.details.join(' ')).toMatch(/password/i);
    });

    it('uses UNAUTHORIZED for a missing token', async () => {
      const response = await request(server()).get('/api/v1/auth/me').expect(401);

      expect(envelope(response).error?.code).toBe('UNAUTHORIZED');
    });

    it('uses FORBIDDEN when a permission is missing', async () => {
      // This role has no CONFIRMATION_VIEW.
      const response = await auth(request(server()).get('/api/v1/confirmations')).expect(403);

      expect(envelope(response).error?.code).toBe('FORBIDDEN');
    });

    it('uses CONFLICT for a rejected state transition', async () => {
      const created = await auth(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `env-${suffix}`,
          factoryId,
          trolleyId: (await prisma.trolley.findFirstOrThrow()).id,
          deviceId: (await prisma.device.findFirstOrThrow()).id,
        })
        .expect(201);
      const id = (envelope(created).data as { id: string }).id;

      // /type needs OPERATOR_IDENTIFIED; the exchange is still CREATED. Chosen
      // over /complete because this role holds EXCHANGE_CREATE, so RbacGuard
      // passes and the state machine is what rejects.
      const response = await auth(request(server()).post(`/api/v1/exchanges/${id}/type`))
        .send({
          exchangeTypeId: (await prisma.exchangeType.findFirstOrThrow()).id,
          oldNeedleTypeId: (await prisma.needleType.findFirstOrThrow()).id,
        })
        .expect(409);

      expect(envelope(response).error?.code).toBe('CONFLICT');
    });

    it('carries the client request id through an error', async () => {
      const response = await request(server())
        .get('/api/v1/auth/me')
        .set('X-Request-ID', `err-${suffix}`)
        .expect(401);

      expect(envelope(response).meta.requestId).toBe(`err-${suffix}`);
    });

    it('returns the envelope for an unmatched route', async () => {
      const response = await auth(request(server()).get('/api/v1/not-a-route')).expect(404);

      expect(envelope(response).success).toBe(false);
      expect(envelope(response).error?.code).toBe('NOT_FOUND');
    });
  });
});
