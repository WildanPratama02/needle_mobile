import { ConfigService } from '@nestjs/config';

import { IdempotencyStore } from '../../../src/common/idempotency/idempotency-store';
import { PrismaService } from '../../../src/database/prisma.service';

const HASH = 'hash-1';
const REQUEST = { key: 'key-1', endpoint: 'POST /api/v1/exchanges', requestHash: HASH };

function build(existing: Record<string, unknown> | null, updateCount = 1) {
  const idempotencyKey = {
    findUnique: jest.fn().mockResolvedValue(existing),
    updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
    create: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  };
  const config = {
    get: (key: string, fallback: number) =>
      key === 'domain.idempotencyInflightTimeoutSeconds' ? 60 : fallback,
  } as unknown as ConfigService;

  const store = new IdempotencyStore({ idempotencyKey } as unknown as PrismaService, config);
  return { store, idempotencyKey };
}

const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000);

describe('IdempotencyStore.claim', () => {
  it('claims a new key', async () => {
    const { store, idempotencyKey } = build(null);

    await expect(store.claim(REQUEST)).resolves.toEqual({ outcome: 'CLAIMED' });
    expect(idempotencyKey.create).toHaveBeenCalled();
  });

  it('reports in-progress when a concurrent insert wins the unique race', async () => {
    const { store, idempotencyKey } = build(null);
    idempotencyKey.create.mockRejectedValue(new Error('unique violation'));

    await expect(store.claim(REQUEST)).resolves.toEqual({ outcome: 'IN_PROGRESS' });
  });

  it('flags the same key with a different body', async () => {
    const { store } = build({ requestHash: 'other', responseStatus: 200, createdAt: new Date() });

    await expect(store.claim(REQUEST)).resolves.toEqual({ outcome: 'MISMATCH' });
  });

  it('replays a recorded outcome', async () => {
    const { store } = build({
      requestHash: HASH,
      responseStatus: 201,
      responseBody: { data: 1 },
      createdAt: new Date(),
    });

    await expect(store.claim(REQUEST)).resolves.toEqual({
      outcome: 'REPLAY',
      responseStatus: 201,
      responseBody: { data: 1 },
    });
  });

  it('keeps a fresh in-flight claim in progress', async () => {
    const { store, idempotencyKey } = build({
      requestHash: HASH,
      responseStatus: null,
      createdAt: secondsAgo(5),
    });

    await expect(store.claim(REQUEST)).resolves.toEqual({ outcome: 'IN_PROGRESS' });
    expect(idempotencyKey.updateMany).not.toHaveBeenCalled();
  });

  it('takes over a stale in-flight claim with a compare-and-set on createdAt', async () => {
    const createdAt = secondsAgo(120);
    const { store, idempotencyKey } = build({ requestHash: HASH, responseStatus: null, createdAt });

    await expect(store.claim(REQUEST)).resolves.toEqual({ outcome: 'CLAIMED' });
    expect(idempotencyKey.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ responseStatus: null, createdAt }) as unknown,
      }),
    );
  });

  it('lets only one of two concurrent reclaims win', async () => {
    const { store } = build(
      { requestHash: HASH, responseStatus: null, createdAt: secondsAgo(120) },
      0,
    );

    await expect(store.claim(REQUEST)).resolves.toEqual({ outcome: 'IN_PROGRESS' });
  });
});
