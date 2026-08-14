import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../database/prisma.service';

export interface RetentionSweepResult {
  idempotencyKeys: number;
  refreshTokens: number;
}

/**
 * Deletes records that have outlived their purpose.
 *
 * Both tables carry `expires_at` and neither was ever cleaned, so both grew
 * without bound. Housekeeping over storage, not domain logic — which is why it
 * lives beside its processor in `jobs/` rather than inside a domain module.
 */
@Injectable()
export class RetentionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Drops idempotency reservations past their retention window.
   *
   * The `expiresAt IS NULL` arm covers rows written before the middleware
   * started stamping an expiry; without it those would never be collected.
   * It is keyed off `createdAt` with the same window, so old and new rows age
   * out identically.
   */
  async sweepIdempotencyKeys(now: Date = new Date()): Promise<number> {
    const retentionHours = this.config.get<number>('domain.idempotencyRetentionHours', 24);
    const cutoff = new Date(now.getTime() - retentionHours * 3600 * 1000);

    const { count } = await this.prisma.idempotencyKey.deleteMany({
      where: {
        OR: [{ expiresAt: { lte: now } }, { expiresAt: null, createdAt: { lte: cutoff } }],
      },
    });

    return count;
  }

  /**
   * Drops refresh tokens that can no longer be presented.
   *
   * **Only expired rows, never merely revoked ones.** Rotation revokes a token
   * and issues its successor; if that revoked row were deleted, presenting the
   * old token would read as "unknown token" instead of "already used", and
   * `TokenService.rotate` would lose the signal it uses to revoke the whole
   * family on suspected theft. Once `expiresAt` has passed the token would be
   * rejected on its own merits anyway, so nothing is lost by then.
   */
  async sweepRefreshTokens(now: Date = new Date()): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    return count;
  }

  async sweep(now: Date = new Date()): Promise<RetentionSweepResult> {
    return {
      idempotencyKeys: await this.sweepIdempotencyKeys(now),
      refreshTokens: await this.sweepRefreshTokens(now),
    };
  }
}
