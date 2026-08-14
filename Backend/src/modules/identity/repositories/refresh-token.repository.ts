import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(params: {
    userId: string;
    tokenHash: string;
    deviceId?: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        deviceId: params.deviceId,
        expiresAt: params.expiresAt,
      },
    });
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  /**
   * Marks a token revoked, but only if it is still live.
   *
   * The `revokedAt: null` filter makes this a compare-and-set: two concurrent
   * refreshes with the same token both try to revoke it, and `count` tells the
   * caller which one actually won.
   */
  async revokeByHash(tokenHash: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return count;
  }

  /** Used when a replayed token suggests the whole family may be compromised. */
  async revokeAllForUser(userId: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return count;
  }
}
