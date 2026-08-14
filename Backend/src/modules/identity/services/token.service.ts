import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';

import { JwtPayload } from '../../../common/interfaces/authenticated-user.interface';
import { parseDurationToSeconds } from '../../../shared/utils/duration';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds, per the Docs/12 §6 login response. */
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  /**
   * Refresh tokens are opaque random strings, not JWTs — they carry no claims,
   * so nothing about them can go stale, and only their hash is persisted.
   */
  private static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private get accessTtlSeconds(): number {
    return parseDurationToSeconds(this.config.get<string>('jwt.expiresIn', '15m'));
  }

  private get refreshTtlSeconds(): number {
    return parseDurationToSeconds(this.config.get<string>('jwt.refreshExpiresIn', '7d'));
  }

  async issuePair(user: { id: string; username: string }, deviceId?: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, username: user.username, type: 'access' };
    const expiresIn = this.accessTtlSeconds;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('jwt.secret'),
      expiresIn,
    });

    // 384 bits of entropy: brute force is not a threat model, so a plain SHA-256
    // lookup hash is enough and keeps `findByHash` a single indexed read.
    const refreshToken = randomBytes(48).toString('hex');

    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: TokenService.hash(refreshToken),
      deviceId,
      expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
    });

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Validates a refresh token, revokes it, and issues a fresh pair.
   *
   * Rotation is single-use. Presenting a token that was already revoked means
   * either a replay or a stolen token, and since we cannot tell which, every
   * live token for that user is revoked and the caller has to log in again.
   */
  async rotate(
    rawToken: string,
    lookupUser: (userId: string) => Promise<{ id: string; username: string } | null>,
    deviceId?: string,
  ): Promise<TokenPair> {
    const tokenHash = TokenService.hash(rawToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token already used');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Lost race: another concurrent refresh revoked it first.
    const revoked = await this.refreshTokens.revokeByHash(tokenHash);
    if (revoked === 0) {
      throw new UnauthorizedException('Refresh token already used');
    }

    const user = await lookupUser(stored.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer active');
    }

    return this.issuePair(user, deviceId ?? stored.deviceId ?? undefined);
  }

  /** Idempotent: logging out with an already-revoked token is not an error. */
  async revoke(rawToken: string): Promise<void> {
    await this.refreshTokens.revokeByHash(TokenService.hash(rawToken));
  }
}
