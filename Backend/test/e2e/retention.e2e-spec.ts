import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
import { RetentionService } from '../../src/jobs/retention.service';
import { createTestApp } from './create-test-app';

function bodyOf<T>(response: { body: unknown }): T {
  return (response.body as { data: T }).data;
}

/**
 * Retention sweeps against real rows (issue 15).
 *
 * The sweep is invoked directly rather than waiting on its hourly schedule —
 * the scheduling itself is BullMQ's job, what matters here is which rows it
 * removes and, more importantly, which it leaves alone.
 */
describe('Record retention (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let retention: RetentionService;

  const suffix = Date.now().toString(36);
  const username = `e2e_ret_${suffix}`;
  const password = 'E2ePassword1!';

  let userId: string;

  const server = () => app.getHttpServer() as Server;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    retention = app.get(RetentionService);

    const user = await prisma.user.create({
      data: { username, name: 'E2E Retention', passwordHash: await hash(password, 4) },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.idempotencyKey.deleteMany({ where: { endpoint: { contains: suffix } } });
    }
    await app?.close();
  });

  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600 * 1000);
  const hoursAhead = (hours: number) => new Date(Date.now() + hours * 3600 * 1000);

  describe('idempotency keys', () => {
    it('removes a key whose expiry has passed and keeps a live one', async () => {
      const expired = await prisma.idempotencyKey.create({
        data: {
          idempotencyKey: `expired-${suffix}`,
          endpoint: `POST /test-${suffix}/expired`,
          requestHash: 'hash',
          expiresAt: hoursAgo(1),
        },
      });
      const live = await prisma.idempotencyKey.create({
        data: {
          idempotencyKey: `live-${suffix}`,
          endpoint: `POST /test-${suffix}/live`,
          requestHash: 'hash',
          expiresAt: hoursAhead(1),
        },
      });

      await retention.sweepIdempotencyKeys();

      expect(await prisma.idempotencyKey.findUnique({ where: { id: expired.id } })).toBeNull();
      expect(await prisma.idempotencyKey.findUnique({ where: { id: live.id } })).not.toBeNull();
    });

    // Rows predating the middleware change carry no expiry at all.
    it('collects an old row with no expiry and spares a recent one', async () => {
      const old = await prisma.idempotencyKey.create({
        data: {
          idempotencyKey: `legacy-old-${suffix}`,
          endpoint: `POST /test-${suffix}/legacy-old`,
          requestHash: 'hash',
          createdAt: hoursAgo(48),
        },
      });
      const recent = await prisma.idempotencyKey.create({
        data: {
          idempotencyKey: `legacy-new-${suffix}`,
          endpoint: `POST /test-${suffix}/legacy-new`,
          requestHash: 'hash',
        },
      });

      await retention.sweepIdempotencyKeys();

      expect(await prisma.idempotencyKey.findUnique({ where: { id: old.id } })).toBeNull();
      expect(await prisma.idempotencyKey.findUnique({ where: { id: recent.id } })).not.toBeNull();
    });

    // The middleware now stamps an expiry, which is what makes sweeping possible.
    it('stamps an expiry on keys written by a real request', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .set('Idempotency-Key', `stamp-${suffix}`)
        .send({ username, password })
        .expect(200);

      const stored = await prisma.idempotencyKey.findFirst({
        where: { idempotencyKey: `stamp-${suffix}` },
      });

      expect(stored).not.toBeNull();
      expect(stored!.expiresAt).not.toBeNull();
      expect(stored!.expiresAt!.getTime()).toBeGreaterThan(Date.now());

      await prisma.idempotencyKey.deleteMany({ where: { idempotencyKey: `stamp-${suffix}` } });
    });
  });

  describe('refresh tokens', () => {
    const createToken = (overrides: { expiresAt: Date; revokedAt?: Date }) =>
      prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: `hash-${suffix}-${Math.random().toString(36).slice(2)}`,
          expiresAt: overrides.expiresAt,
          revokedAt: overrides.revokedAt,
        },
      });

    it('removes an expired token and keeps a live one', async () => {
      const expired = await createToken({ expiresAt: hoursAgo(1) });
      const live = await createToken({ expiresAt: hoursAhead(24) });

      await retention.sweepRefreshTokens();

      expect(await prisma.refreshToken.findUnique({ where: { id: expired.id } })).toBeNull();
      expect(await prisma.refreshToken.findUnique({ where: { id: live.id } })).not.toBeNull();
    });

    /**
     * The rule that keeps token-theft detection working: a rotated token is
     * revoked but not yet expired, and `TokenService.rotate` recognises a
     * replay by finding that row. Sweeping it early would downgrade
     * "already used — revoke the family" to "unknown token".
     */
    it('keeps a revoked but unexpired token', async () => {
      const revoked = await createToken({ expiresAt: hoursAhead(24), revokedAt: new Date() });

      await retention.sweepRefreshTokens();

      expect(await prisma.refreshToken.findUnique({ where: { id: revoked.id } })).not.toBeNull();
    });

    it('removes a revoked token once it has also expired', async () => {
      const dead = await createToken({ expiresAt: hoursAgo(1), revokedAt: hoursAgo(2) });

      await retention.sweepRefreshTokens();

      expect(await prisma.refreshToken.findUnique({ where: { id: dead.id } })).toBeNull();
    });

    // Proves the sweep does not break rotation's replay detection in practice.
    it('leaves rotation reuse detection intact after a sweep', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ username, password })
        .expect(200);
      const { refreshToken } = bodyOf<{ refreshToken: string }>(login);

      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(200);

      await retention.sweepRefreshTokens();

      // Still recognised as a used token rather than an unknown one.
      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    });
  });

  describe('combined sweep', () => {
    it('reports a count for each table', async () => {
      await prisma.idempotencyKey.create({
        data: {
          idempotencyKey: `combined-${suffix}`,
          endpoint: `POST /test-${suffix}/combined`,
          requestHash: 'hash',
          expiresAt: hoursAgo(1),
        },
      });
      await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: `combined-hash-${suffix}`,
          expiresAt: hoursAgo(1),
        },
      });

      const result = await retention.sweep();

      expect(result.idempotencyKeys).toBeGreaterThanOrEqual(1);
      expect(result.refreshTokens).toBeGreaterThanOrEqual(1);
    });

    it('is safe to run when there is nothing to collect', async () => {
      await retention.sweep();

      await expect(retention.sweep()).resolves.toEqual({
        idempotencyKeys: expect.any(Number) as number,
        refreshTokens: expect.any(Number) as number,
      });
    });
  });
});
