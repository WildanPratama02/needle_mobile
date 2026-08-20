import { Injectable } from '@nestjs/common';
import { PasswordResetToken } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(params: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
      },
    });
  }

  findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  /**
   * Marks a token used, but only if it is still live — the same
   * compare-and-set shape as RefreshTokenRepository.revokeByHash, so two
   * concurrent submits of the same link cannot both succeed.
   */
  async markUsed(tokenHash: string): Promise<number> {
    const { count } = await this.prisma.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null },
      data: { usedAt: new Date() },
    });

    return count;
  }

  /** Invalidates any earlier live tokens when a new reset is requested. */
  async invalidateAllForUser(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
