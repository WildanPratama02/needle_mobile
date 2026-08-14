import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';

import { TokenService } from '../../../src/modules/identity/services/token.service';
import { RefreshTokenRepository } from '../../../src/modules/identity/repositories/refresh-token.repository';

const USER = { id: 'user-1', username: 'admin' };

/** In-memory stand-in for the refresh_tokens table. */
class FakeRefreshTokenRepository {
  rows = new Map<string, RefreshToken>();

  create(params: { userId: string; tokenHash: string; deviceId?: string; expiresAt: Date }) {
    const row = {
      id: `rt-${this.rows.size + 1}`,
      userId: params.userId,
      tokenHash: params.tokenHash,
      deviceId: params.deviceId ?? null,
      expiresAt: params.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    } as RefreshToken;

    this.rows.set(params.tokenHash, row);
    return Promise.resolve(row);
  }

  findByHash(tokenHash: string) {
    return Promise.resolve(this.rows.get(tokenHash) ?? null);
  }

  revokeByHash(tokenHash: string) {
    const row = this.rows.get(tokenHash);
    if (!row || row.revokedAt) {
      return Promise.resolve(0);
    }
    row.revokedAt = new Date();
    return Promise.resolve(1);
  }

  revokeAllForUser(userId: string) {
    let count = 0;
    for (const row of this.rows.values()) {
      if (row.userId === userId && !row.revokedAt) {
        row.revokedAt = new Date();
        count += 1;
      }
    }
    return Promise.resolve(count);
  }
}

function buildService(): { service: TokenService; repo: FakeRefreshTokenRepository } {
  const repo = new FakeRefreshTokenRepository();
  const config = {
    get: (key: string, fallback?: string) =>
      ({ 'jwt.expiresIn': '15m', 'jwt.refreshExpiresIn': '7d' })[key] ?? fallback,
    getOrThrow: () => 'test-secret-value-at-least-32-chars',
  } as unknown as ConfigService;

  const service = new TokenService(
    new JwtService({ secret: 'test-secret-value-at-least-32-chars' }),
    config,
    repo as unknown as RefreshTokenRepository,
  );

  return { service, repo };
}

const lookup = () => Promise.resolve(USER);

describe('TokenService', () => {
  it('issues an access token and an opaque refresh token', async () => {
    const { service, repo } = buildService();

    const pair = await service.issuePair(USER);

    expect(pair.expiresIn).toBe(900);
    expect(pair.accessToken.split('.')).toHaveLength(3);
    // Opaque, not a JWT.
    expect(pair.refreshToken).toMatch(/^[0-9a-f]{96}$/);
    expect(repo.rows.size).toBe(1);
  });

  it('never stores the raw refresh token', async () => {
    const { service, repo } = buildService();

    const pair = await service.issuePair(USER);

    expect([...repo.rows.keys()]).not.toContain(pair.refreshToken);
  });

  it('rotates: the old token is revoked and a new pair issued', async () => {
    const { service, repo } = buildService();
    const first = await service.issuePair(USER);

    const second = await service.rotate(first.refreshToken, lookup);

    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect([...repo.rows.values()].filter((row) => row.revokedAt !== null)).toHaveLength(1);
  });

  it('treats reuse of a rotated token as compromise and revokes the whole family', async () => {
    const { service, repo } = buildService();
    const first = await service.issuePair(USER);
    await service.rotate(first.refreshToken, lookup);

    await expect(service.rotate(first.refreshToken, lookup)).rejects.toThrow(UnauthorizedException);

    // Including the freshly issued one — the user has to log in again.
    expect([...repo.rows.values()].every((row) => row.revokedAt !== null)).toBe(true);
  });

  it('rejects an unknown refresh token', async () => {
    const { service } = buildService();

    await expect(service.rotate('deadbeef', lookup)).rejects.toThrow('Invalid refresh token');
  });

  it('rejects an expired refresh token', async () => {
    const { service, repo } = buildService();
    const pair = await service.issuePair(USER);
    for (const row of repo.rows.values()) {
      row.expiresAt = new Date(Date.now() - 1000);
    }

    await expect(service.rotate(pair.refreshToken, lookup)).rejects.toThrow('expired');
  });

  it('rejects rotation when the user is no longer active', async () => {
    const { service } = buildService();
    const pair = await service.issuePair(USER);

    await expect(service.rotate(pair.refreshToken, () => Promise.resolve(null))).rejects.toThrow(
      'User no longer active',
    );
  });

  it('carries the device id onto the rotated token', async () => {
    const { service, repo } = buildService();
    const first = await service.issuePair(USER, 'NM-TAB-001');

    await service.rotate(first.refreshToken, lookup);

    expect([...repo.rows.values()].every((row) => row.deviceId === 'NM-TAB-001')).toBe(true);
  });

  it('revokes idempotently on logout', async () => {
    const { service } = buildService();
    const pair = await service.issuePair(USER);

    await service.revoke(pair.refreshToken);
    await expect(service.revoke(pair.refreshToken)).resolves.toBeUndefined();
  });
});
