import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../src/database/prisma.service';
import { RetentionService } from '../../../src/jobs/retention.service';

interface DeleteManyCall {
  where: Record<string, unknown>;
}

const NOW = new Date('2026-08-12T12:00:00.000Z');

function build(options: { retentionHours?: number; deleted?: number } = {}) {
  const idempotencyDelete = jest
    .fn<Promise<{ count: number }>, [DeleteManyCall]>()
    .mockResolvedValue({ count: options.deleted ?? 0 });
  const refreshDelete = jest
    .fn<Promise<{ count: number }>, [DeleteManyCall]>()
    .mockResolvedValue({ count: options.deleted ?? 0 });

  const prisma = {
    idempotencyKey: { deleteMany: idempotencyDelete },
    refreshToken: { deleteMany: refreshDelete },
  };

  const config = {
    get: (_key: string, fallback: number) => options.retentionHours ?? fallback,
  } as unknown as ConfigService;

  return {
    service: new RetentionService(prisma as unknown as PrismaService, config),
    idempotencyDelete,
    refreshDelete,
  };
}

describe('RetentionService.sweepIdempotencyKeys', () => {
  it('deletes rows whose expiry has passed', async () => {
    const { service, idempotencyDelete } = build();

    await service.sweepIdempotencyKeys(NOW);

    const or = idempotencyDelete.mock.calls[0][0].where.OR as Record<string, unknown>[];
    expect(or[0]).toEqual({ expiresAt: { lte: NOW } });
  });

  // Rows written before the middleware started stamping an expiry would
  // otherwise never be collected.
  it('also collects legacy rows with no expiry, by age', async () => {
    const { service, idempotencyDelete } = build({ retentionHours: 24 });

    await service.sweepIdempotencyKeys(NOW);

    const or = idempotencyDelete.mock.calls[0][0].where.OR as Record<string, unknown>[];
    expect(or[1]).toEqual({
      expiresAt: null,
      createdAt: { lte: new Date('2026-08-11T12:00:00.000Z') },
    });
  });

  it('honours a configured retention window', async () => {
    const { service, idempotencyDelete } = build({ retentionHours: 2 });

    await service.sweepIdempotencyKeys(NOW);

    const or = idempotencyDelete.mock.calls[0][0].where.OR as Record<string, unknown>[];
    expect(or[1]).toMatchObject({
      createdAt: { lte: new Date('2026-08-12T10:00:00.000Z') },
    });
  });

  it('reports how many rows were removed', async () => {
    const { service } = build({ deleted: 7 });

    await expect(service.sweepIdempotencyKeys(NOW)).resolves.toBe(7);
  });
});

describe('RetentionService.sweepRefreshTokens', () => {
  it('deletes only tokens whose expiry has passed', async () => {
    const { service, refreshDelete } = build();

    await service.sweepRefreshTokens(NOW);

    expect(refreshDelete.mock.calls[0][0].where).toEqual({ expiresAt: { lte: NOW } });
  });

  /**
   * The rule that protects theft detection: rotation revokes a token and
   * issues its successor, and `TokenService.rotate` recognises a replay by
   * finding that revoked row. Deleting revoked-but-unexpired rows would turn
   * "already used — revoke the family" into a plain "unknown token".
   */
  it('does not filter on revokedAt, so revoked tokens survive until they expire', async () => {
    const { service, refreshDelete } = build();

    await service.sweepRefreshTokens(NOW);

    expect(refreshDelete.mock.calls[0][0].where).not.toHaveProperty('revokedAt');
    expect(JSON.stringify(refreshDelete.mock.calls[0][0].where)).not.toContain('revoked');
  });

  it('reports how many rows were removed', async () => {
    const { service } = build({ deleted: 3 });

    await expect(service.sweepRefreshTokens(NOW)).resolves.toBe(3);
  });
});

describe('RetentionService.sweep', () => {
  it('sweeps both tables and reports each count', async () => {
    const { service, idempotencyDelete, refreshDelete } = build({ deleted: 4 });

    await expect(service.sweep(NOW)).resolves.toEqual({
      idempotencyKeys: 4,
      refreshTokens: 4,
    });
    expect(idempotencyDelete).toHaveBeenCalledTimes(1);
    expect(refreshDelete).toHaveBeenCalledTimes(1);
  });

  it('reports zeroes when there is nothing to collect', async () => {
    const { service } = build({ deleted: 0 });

    await expect(service.sweep(NOW)).resolves.toEqual({
      idempotencyKeys: 0,
      refreshTokens: 0,
    });
  });
});
