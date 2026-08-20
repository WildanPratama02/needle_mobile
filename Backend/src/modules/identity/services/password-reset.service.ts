import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

import { EMAIL_CLIENT, EmailPort } from '../../../integrations/email/email.port';
import { PasswordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { buildPasswordResetEmail } from '../templates/password-reset.email';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const PASSWORD_HASH_ROUNDS = 10;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly resetTokens: PasswordResetTokenRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly config: ConfigService,
    @Inject(EMAIL_CLIENT) private readonly email: EmailPort,
  ) {}

  /**
   * Opaque reset tokens are random strings, not JWTs, same reasoning as
   * TokenService's refresh token: only the hash is persisted.
   */
  private static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Always resolves quickly whether or not the email matches an account — the
   * controller returns one generic message either way (anti-enumeration), and
   * the send itself is fire-and-forget rather than awaited so a real send's
   * network latency cannot be timed against the no-such-user path.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);

    if (!user || user.status !== UserStatus.ACTIVE || !user.email) {
      return;
    }

    await this.resetTokens.invalidateAllForUser(user.id);

    const rawToken = randomBytes(32).toString('hex');
    await this.resetTokens.create({
      userId: user.id,
      tokenHash: PasswordResetService.hash(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetLink = `${this.config.getOrThrow<string>('app.webUrl')}/reset-password?token=${rawToken}`;
    const message = buildPasswordResetEmail(resetLink);

    this.email.sendMail({ to: user.email, ...message }).catch((error: Error) => {
      this.logger.error(`Password reset email failed for user ${user.id}: ${error.message}`);
    });
  }

  /**
   * Consumes a reset token and sets the new password. Every existing session
   * is revoked — a password reset must kill any stolen or leaked refresh
   * token, not just future logins.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = PasswordResetService.hash(rawToken);
    const stored = await this.resetTokens.findByHash(tokenHash);
    const invalid = new BadRequestException('Reset token is invalid or has expired');

    if (!stored || stored.usedAt || stored.expiresAt.getTime() <= Date.now()) {
      throw invalid;
    }

    // Compare-and-set: a concurrent submit of the same link must not both win.
    const claimed = await this.resetTokens.markUsed(tokenHash);
    if (claimed === 0) {
      throw invalid;
    }

    const passwordHash = await hash(newPassword, PASSWORD_HASH_ROUNDS);
    await this.users.updatePasswordHash(stored.userId, passwordHash);
    await this.refreshTokens.revokeAllForUser(stored.userId);
  }
}
