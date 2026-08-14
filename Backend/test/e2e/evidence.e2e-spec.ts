import { INestApplication } from '@nestjs/common';
import { EvidenceStatus, EvidenceType, ExchangeState } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { PERMISSIONS } from '../../src/shared/constants/permissions';

interface UploadBody {
  id: string;
  evidenceType: EvidenceType;
  storageKey: string;
  status: EvidenceStatus;
  checksum: string | null;
  exchangeStatus: ExchangeState;
  outstanding: EvidenceType[];
}

interface EvidenceListItem {
  id: string;
  evidenceType: EvidenceType;
  url: string | null;
}

function bodyOf<T>(response: { body: unknown }): T {
  // Every response is wrapped in the Docs/12 §7 envelope; tests assert on the payload.
  return (response.body as { data: T }).data;
}

/** Smallest valid PNG — enough for a real round trip through MinIO. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Evidence upload against the real MinIO from docker-compose. The point is the
 * round trip — a mocked storage port would not prove the adapter, the bucket,
 * or the presigned URL.
 */
describe('Evidence upload (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now().toString(36);
  const password = 'E2ePassword1!';
  const picUsername = `e2e_ev_pic_${suffix}`;
  const roleCode = `E2E_EV_PIC_${suffix}`.toUpperCase();

  let token: string;
  let ids: {
    factoryId: string;
    trolleyId: string;
    deviceId: string;
    needleTypeId: string;
    bentTypeId: string;
    brokenTypeId: string;
    rfidUid: string;
  };
  let sequence = 0;

  const server = () => app.getHttpServer() as Server;
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

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
      deviceId: device.id,
      needleTypeId: needleType.id,
      bentTypeId: bent.id,
      brokenTypeId: broken.id,
      rfidUid: card.rfidUid,
    };

    const permissions = await Promise.all(
      [PERMISSIONS.EXCHANGE_VIEW, PERMISSIONS.EXCHANGE_CREATE].map((code) =>
        prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } }),
      ),
    );

    const role = await prisma.role.create({
      data: {
        code: roleCode,
        name: 'E2E evidence PIC',
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    await prisma.user.create({
      data: {
        username: picUsername,
        name: 'E2E Evidence PIC',
        passwordHash: await hash(password, 4),
        roles: { create: [{ roleId: role.id }] },
        factoryScopes: { create: [{ factoryId: ids.factoryId }] },
      },
    });

    const login = await request(server())
      .post('/api/v1/auth/login')
      .send({ username: picUsername, password })
      .expect(200);
    token = bodyOf<{ accessToken: string }>(login).accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      const pic = await prisma.user.findUnique({ where: { username: picUsername } });

      if (pic) {
        const owned = await prisma.exchange.findMany({
          where: { picUserId: pic.id },
          select: { id: true },
        });
        const ownedIds = owned.map((row) => row.id);

        await prisma.exchangeEvidence.deleteMany({ where: { exchangeId: { in: ownedIds } } });
        await prisma.confirmation.deleteMany({ where: { exchangeId: { in: ownedIds } } });
        await prisma.exchange.deleteMany({ where: { id: { in: ownedIds } } });
      }

      await prisma.user.deleteMany({ where: { username: picUsername } });
      await prisma.role.deleteMany({ where: { code: roleCode } });
    }
    await app?.close();
  });

  /** Drives an exchange up to the point evidence is expected. */
  const exchangeReadyForEvidence = async (
    type: 'BENT' | 'BROKEN',
    fragmentStatus?: 'FOUND' | 'NOT_FOUND',
  ): Promise<string> => {
    sequence += 1;

    const created = await auth(request(server()).post('/api/v1/exchanges'))
      .send({
        clientTransactionId: `ev-${suffix}-${sequence}`,
        factoryId: ids.factoryId,
        trolleyId: ids.trolleyId,
        deviceId: ids.deviceId,
      })
      .expect(201);
    const id = bodyOf<{ id: string }>(created).id;

    await auth(request(server()).post(`/api/v1/exchanges/${id}/operator`))
      .send({ rfidUid: ids.rfidUid })
      .expect(200);
    await auth(request(server()).post(`/api/v1/exchanges/${id}/type`))
      .send({
        exchangeTypeId: type === 'BENT' ? ids.bentTypeId : ids.brokenTypeId,
        oldNeedleTypeId: ids.needleTypeId,
      })
      .expect(200);

    if (fragmentStatus) {
      await auth(request(server()).post(`/api/v1/exchanges/${id}/fragment`))
        .send({ fragmentStatus })
        .expect(200);
    }

    return id;
  };

  const upload = (exchangeId: string, evidenceType: EvidenceType, filename = 'photo.png') =>
    auth(request(server()).post(`/api/v1/exchanges/${exchangeId}/evidence`))
      .field('evidenceType', evidenceType)
      .attach('file', PNG, { filename, contentType: 'image/png' });

  describe('BENT exchange — OLD_NEEDLE only', () => {
    it('stores the photo and advances to EVIDENCE_CAPTURED', async () => {
      const id = await exchangeReadyForEvidence('BENT');

      const response = await upload(id, EvidenceType.OLD_NEEDLE).expect(201);
      const body = bodyOf<UploadBody>(response);

      expect(body.status).toBe(EvidenceStatus.UPLOADED);
      expect(body.storageKey).toMatch(
        new RegExp(`^exchanges/\\d{4}/\\d{2}/${id}/[0-9a-f-]+\\.png$`),
      );
      expect(body.checksum).toEqual(expect.any(String));
      expect(body.outstanding).toEqual([]);
      expect(body.exchangeStatus).toBe(ExchangeState.EVIDENCE_CAPTURED);

      const exchange = await prisma.exchange.findUniqueOrThrow({ where: { id } });
      expect(exchange.state).toBe(ExchangeState.EVIDENCE_CAPTURED);
    });

    it('returns a working presigned URL', async () => {
      const id = await exchangeReadyForEvidence('BENT');
      await upload(id, EvidenceType.OLD_NEEDLE).expect(201);

      const listed = await auth(request(server()).get(`/api/v1/exchanges/${id}/evidence`)).expect(
        200,
      );
      const items = bodyOf<EvidenceListItem[]>(listed);

      expect(items).toHaveLength(1);
      expect(items[0].url).toEqual(expect.stringContaining('http'));

      // Fetch the object back out and confirm it is byte-identical.
      const download = await fetch(items[0].url!);
      expect(download.ok).toBe(true);
      expect(Buffer.from(await download.arrayBuffer()).equals(PNG)).toBe(true);
    });

    it('accepts an optional OTHER photo afterwards without re-transitioning', async () => {
      const id = await exchangeReadyForEvidence('BENT');
      await upload(id, EvidenceType.OLD_NEEDLE).expect(201);

      const response = await upload(id, EvidenceType.OTHER).expect(201);

      expect(bodyOf<UploadBody>(response).exchangeStatus).toBe(ExchangeState.EVIDENCE_CAPTURED);
    });
  });

  describe('BROKEN exchange — fragment policy', () => {
    // Round 4 Q9: BROKEN_FRAGMENT is mandatory only when the fragment was found.
    it('holds at FRAGMENT_CHECK until the fragment photo arrives', async () => {
      const id = await exchangeReadyForEvidence('BROKEN', 'FOUND');

      const first = await upload(id, EvidenceType.OLD_NEEDLE).expect(201);
      expect(bodyOf<UploadBody>(first).outstanding).toEqual([EvidenceType.BROKEN_FRAGMENT]);
      expect(bodyOf<UploadBody>(first).exchangeStatus).toBe(ExchangeState.FRAGMENT_CHECK);

      const second = await upload(id, EvidenceType.BROKEN_FRAGMENT).expect(201);
      expect(bodyOf<UploadBody>(second).outstanding).toEqual([]);
      expect(bodyOf<UploadBody>(second).exchangeStatus).toBe(ExchangeState.EVIDENCE_CAPTURED);
    });

    it('needs no fragment photo when the fragment was NOT_FOUND and approved', async () => {
      const id = await exchangeReadyForEvidence('BROKEN', 'NOT_FOUND');
      const confirmation = await prisma.confirmation.findUniqueOrThrow({
        where: { exchangeId: id },
      });
      await prisma.confirmation.update({
        where: { id: confirmation.id },
        data: { status: 'APPROVED', decidedAt: new Date() },
      });

      const response = await upload(id, EvidenceType.OLD_NEEDLE).expect(201);

      expect(bodyOf<UploadBody>(response).outstanding).toEqual([]);
      expect(bodyOf<UploadBody>(response).exchangeStatus).toBe(ExchangeState.EVIDENCE_CAPTURED);
    });

    // The exchange stops advancing while a confirmation is unresolved.
    it('stores the photo but refuses to advance while the confirmation is PENDING', async () => {
      const id = await exchangeReadyForEvidence('BROKEN', 'NOT_FOUND');

      await upload(id, EvidenceType.OLD_NEEDLE).expect(409);

      // The upload itself succeeded — only the transition was refused.
      const stored = await prisma.exchangeEvidence.findMany({ where: { exchangeId: id } });
      expect(stored).toHaveLength(1);
      expect(stored[0].status).toBe(EvidenceStatus.UPLOADED);

      const exchange = await prisma.exchange.findUniqueOrThrow({ where: { id } });
      expect(exchange.state).toBe(ExchangeState.CONFIRMATION_PENDING);
    });

    it('refuses evidence before the fragment status is recorded', async () => {
      const id = await exchangeReadyForEvidence('BROKEN');

      await upload(id, EvidenceType.OLD_NEEDLE).expect(409);
    });
  });

  describe('validation', () => {
    it('rejects a request with no file', async () => {
      const id = await exchangeReadyForEvidence('BENT');

      await auth(request(server()).post(`/api/v1/exchanges/${id}/evidence`))
        .field('evidenceType', EvidenceType.OLD_NEEDLE)
        .expect(400);
    });

    it('rejects an unsupported content type', async () => {
      const id = await exchangeReadyForEvidence('BENT');

      await auth(request(server()).post(`/api/v1/exchanges/${id}/evidence`))
        .field('evidenceType', EvidenceType.OLD_NEEDLE)
        .attach('file', Buffer.from('not an image'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('rejects an unknown evidence type', async () => {
      const id = await exchangeReadyForEvidence('BENT');

      await auth(request(server()).post(`/api/v1/exchanges/${id}/evidence`))
        .field('evidenceType', 'SELFIE')
        .attach('file', PNG, { filename: 'photo.png', contentType: 'image/png' })
        .expect(400);
    });

    it('refuses evidence on an exchange that has not selected a type', async () => {
      sequence += 1;
      const created = await auth(request(server()).post('/api/v1/exchanges'))
        .send({
          clientTransactionId: `ev-early-${suffix}-${sequence}`,
          factoryId: ids.factoryId,
          trolleyId: ids.trolleyId,
          deviceId: ids.deviceId,
        })
        .expect(201);

      await upload(bodyOf<{ id: string }>(created).id, EvidenceType.OLD_NEEDLE).expect(409);
    });

    it('404s an unknown exchange', async () => {
      await upload('00000000-0000-0000-0000-000000000000', EvidenceType.OLD_NEEDLE).expect(404);
    });

    it('rejects an unauthenticated upload', async () => {
      const id = await exchangeReadyForEvidence('BENT');

      await request(server())
        .post(`/api/v1/exchanges/${id}/evidence`)
        .field('evidenceType', EvidenceType.OLD_NEEDLE)
        .attach('file', PNG, { filename: 'photo.png', contentType: 'image/png' })
        .expect(401);
    });
  });
});
