import { INestApplication } from '@nestjs/common';
import { ExchangeState } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
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

interface ExchangeRow {
  id: string;
  exchangeNumber: string;
  status: string;
  exchangeTypeId: string | null;
  exchangeTypeCode: string | null;
  exchangeTypeName: string | null;
  createdAt: string;
}

const envelope = <T>(response: { body: unknown }) => response.body as Envelope<T>;

/**
 * `GET /exchanges` — the list contract (`.scratch/backend-correctness/spec.md`).
 *
 * Asserted at the HTTP boundary: status code, rows returned, fields present.
 * Nothing here inspects a validator decorator or a sort clause — for ordering
 * the test worth writing is "paging same-timestamp rows returns each exactly
 * once", which survives any change to how the order is expressed.
 */
describe('Exchange list (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const username = `e2e_xl_pic_${suffix}`;
  const roleCode = `E2E_XL_PIC_${suffix}`.toUpperCase();

  let token: string;
  let bentTypeId: string;
  const createdExchangeIds: string[] = [];

  const server = () => app.getHttpServer() as Server;
  const as = (t: string) => (req: request.Test) => req.set('Authorization', `Bearer ${t}`);
  const list = (qs = '') => as(token)(request(server()).get(`/api/v1/exchanges${qs}`));

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const trolley = await prisma.trolley.findFirstOrThrow();
    const device = await prisma.device.findFirstOrThrow();
    const bent = await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BENT' } });
    const needleType = await prisma.needleType.findFirstOrThrow();
    const card = await prisma.rfidCard.findFirstOrThrow();
    bentTypeId = bent.id;

    const permissions = await Promise.all(
      [PERMISSIONS.EXCHANGE_CREATE, PERMISSIONS.EXCHANGE_VIEW].map((code) =>
        prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
      ),
    );

    const role = await prisma.role.create({
      data: {
        code: roleCode,
        name: 'E2E exchange-list PIC',
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username,
        name: 'E2E XL PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: role.id }] },
        factoryScopes: { create: [{ factoryId: trolley.factoryId }] },
      },
    });

    const login = await request(server())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(200);
    token = envelope<{ accessToken: string }>(login).data.accessToken;

    // Four exchanges: one advanced far enough to carry an exchange type, the
    // rest left at CREATED, so the projected name has both cases to prove.
    for (let i = 0; i < 4; i += 1) {
      const created = await as(token)(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `xl-${suffix}-${i}`,
          factoryId: trolley.factoryId,
          trolleyId: trolley.id,
          deviceId: device.id,
        })
        .expect(201);
      createdExchangeIds.push(envelope<{ id: string }>(created).data.id);
    }

    const [typed] = createdExchangeIds;
    await as(token)(request(server()).post(`/api/v1/exchanges/${typed}/operator`))
      .send({ rfidUid: card.rfidUid })
      .expect(200);
    await as(token)(request(server()).post(`/api/v1/exchanges/${typed}/type`))
      .send({ exchangeTypeId: bentTypeId, oldNeedleTypeId: needleType.id })
      .expect(200);

    // Collapse every fixture row onto one instant. Without a tiebreaker the
    // database is then free to return them in any order, which is exactly the
    // condition under which paging drops or repeats a row.
    await prisma.exchange.updateMany({
      where: { id: { in: createdExchangeIds } },
      data: { createdAt: new Date('2026-08-14T00:00:00.000Z') },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: createdExchangeIds } } });
      await prisma.exchange.deleteMany({ where: { id: { in: createdExchangeIds } } });
      await prisma.user.deleteMany({ where: { username } });
      await prisma.role.deleteMany({ where: { code: roleCode } });
    }
    await app?.close();
  });

  describe('status filter validation', () => {
    it.each(Object.values(ExchangeState))('accepts the real state %s', async (state) => {
      await list(`?status=${state}`).expect(200);
    });

    // The DTO whitelist is this request's only input boundary. A value that
    // escapes it reaches the ORM and fails there, surfacing as a 500.
    it('refuses a value outside the enum with 400, not 500', async () => {
      const response = await list('?status=NOT_A_STATE').expect(400);

      expect(envelope<unknown>(response).success).toBe(false);
    });

    it('names the offending parameter in the error', async () => {
      const response = await list('?status=NOT_A_STATE').expect(400);

      expect(JSON.stringify(response.body).toLowerCase()).toContain('status');
    });

    it('refuses a lowercase form of a real state', async () => {
      await list('?status=completed').expect(400);
    });

    it('still returns rows when no status is given', async () => {
      const response = await list('?pageSize=100').expect(200);

      expect(envelope<ExchangeRow[]>(response).data.length).toBeGreaterThan(0);
    });
  });

  describe('stable paging', () => {
    it('returns each row exactly once across pages when timestamps collide', async () => {
      const seen: string[] = [];

      for (let page = 1; page <= 6; page += 1) {
        const response = await list(`?page=${page}&pageSize=1`).expect(200);
        seen.push(...envelope<ExchangeRow[]>(response).data.map((row) => row.id));
      }

      const mine = seen.filter((id) => createdExchangeIds.includes(id));
      expect(mine.length).toBeGreaterThan(1);
      expect(new Set(mine).size).toBe(mine.length);
    });

    it('is stable across identical repeated requests', async () => {
      const a = await list('?page=1&pageSize=4').expect(200);
      const b = await list('?page=1&pageSize=4').expect(200);

      expect(envelope<ExchangeRow[]>(a).data.map((r) => r.id)).toEqual(
        envelope<ExchangeRow[]>(b).data.map((r) => r.id),
      );
    });

    /**
     * The assertion with teeth. "Each row exactly once" passes even without a
     * tiebreaker whenever the database happens to return a stable physical
     * order, which it usually does for a small table — so it guards against
     * regression but does not demonstrate the defect. Ties resolving by id is
     * the observable contract, and it only holds once the tiebreaker exists.
     */
    it('breaks ties by id, descending', async () => {
      const response = await list('?pageSize=100').expect(200);
      const rows = envelope<ExchangeRow[]>(response).data;

      const tied = rows.filter((row) => createdExchangeIds.includes(row.id));
      const ids = tied.map((row) => row.id);

      expect(ids.length).toBeGreaterThan(1);
      expect(ids).toEqual([...ids].sort((a, b) => b.localeCompare(a)));
    });

    it('keeps newest first as the primary order', async () => {
      const response = await list('?pageSize=100').expect(200);
      const times = envelope<ExchangeRow[]>(response).data.map((r) => Date.parse(r.createdAt));

      for (let i = 1; i < times.length; i += 1) {
        expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
      }
    });
  });

  describe('exchange type name', () => {
    it('carries the code and name once a type is selected', async () => {
      const response = await list('?pageSize=100').expect(200);
      const typed = envelope<ExchangeRow[]>(response).data.find(
        (row) => row.id === createdExchangeIds[0],
      )!;

      expect(typed.exchangeTypeId).toBe(bentTypeId);
      expect(typed.exchangeTypeCode).toBe('BENT');
      expect(typeof typed.exchangeTypeName).toBe('string');
      expect(typed.exchangeTypeName?.length).toBeGreaterThan(0);
    });

    // An exchange is opened before a type is chosen, so "not chosen yet" must
    // stay distinguishable from a real value rather than getting a placeholder.
    it('leaves both null before a type is selected', async () => {
      const response = await list('?pageSize=100').expect(200);
      const untyped = envelope<ExchangeRow[]>(response).data.find(
        (row) => row.id === createdExchangeIds[1],
      )!;

      expect(untyped.exchangeTypeId).toBeNull();
      expect(untyped.exchangeTypeCode).toBeNull();
      expect(untyped.exchangeTypeName).toBeNull();
    });

    it('carries them on the detail route too', async () => {
      const response = await as(token)(
        request(server()).get(`/api/v1/exchanges/${createdExchangeIds[0]}`),
      ).expect(200);

      expect(envelope<ExchangeRow>(response).data.exchangeTypeCode).toBe('BENT');
    });

    it('carries them on a transition response too', async () => {
      const created = await as(token)(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `xl-${suffix}-transition`,
          factoryId: (await prisma.trolley.findFirstOrThrow()).factoryId,
          trolleyId: (await prisma.trolley.findFirstOrThrow()).id,
          deviceId: (await prisma.device.findFirstOrThrow()).id,
        })
        .expect(201);

      const id = envelope<{ id: string }>(created).data.id;
      createdExchangeIds.push(id);

      const card = await prisma.rfidCard.findFirstOrThrow();
      const needleType = await prisma.needleType.findFirstOrThrow();
      await as(token)(request(server()).post(`/api/v1/exchanges/${id}/operator`))
        .send({ rfidUid: card.rfidUid })
        .expect(200);

      const typed = await as(token)(request(server()).post(`/api/v1/exchanges/${id}/type`))
        .send({ exchangeTypeId: bentTypeId, oldNeedleTypeId: needleType.id })
        .expect(200);

      expect(envelope<ExchangeRow>(typed).data.exchangeTypeCode).toBe('BENT');
    });
  });
});
