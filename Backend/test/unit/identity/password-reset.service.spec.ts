import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordResetToken, User, UserStatus } from '@prisma/client';
import { compare } from 'bcryptjs';

import { EmailPort } from '../../../src/integrations/email/email.port';
import { PasswordResetService } from '../../../src/modules/identity/services/password-reset.service';

const USER_ID = 'user-1';
const EMAIL = 'admin@needle.local';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    username: 'admin',
    name: 'System Admin',
    email: EMAIL,
    phoneNumber: null,
    passwordHash: 'old-hash',
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** In-memory stand-in for the password_reset_tokens table. */
class FakeResetTokenRepository {
  rows = new Map<string, PasswordResetToken>();

  create(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    const row = {
      id: `prt-${this.rows.size + 1}`,
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    } as PasswordResetToken;
    this.rows.set(params.tokenHash, row);
    return Promise.resolve(row);
  }

  findByHash(tokenHash: string) {
    return Promise.resolve(this.rows.get(tokenHash) ?? null);
  }

  markUsed(tokenHash: string) {
    const row = this.rows.get(tokenHash);
    if (!row || row.usedAt) {
      return Promise.resolve(0);
    }
    row.usedAt = new Date();
    return Promise.resolve(1);
  }

  invalidateAllForUser(userId: string) {
    for (const row of this.rows.values()) {
      if (row.userId === userId && !row.usedAt) {
        row.usedAt = new Date();
      }
    }
    return Promise.resolve();
  }
}

function buildService(user: User | null) {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(user),
    updatePasswordHash: jest.fn().mockResolvedValue(undefined),
  };

  const resetTokens = new FakeResetTokenRepository();

  const refreshTokens = {
    revokeAllForUser: jest.fn().mockResolvedValue(0),
  };

  const config = {
    getOrThrow: () => 'http://localhost:5173',
  } as unknown as ConfigService;

  const email: jest.Mocked<EmailPort> = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

  const service = new PasswordResetService(
    users as any,
    resetTokens as any,
    refreshTokens as any,
    config,
    email,
  );

  return { service, users, resetTokens, refreshTokens, email };
}

// Give fire-and-forget email sends a tick to settle before asserting on them.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('PasswordResetService.requestReset', () => {
  it('creates a token and emails the reset link for a known active user', async () => {
    const { service, resetTokens, email } = buildService(buildUser());

    await service.requestReset(EMAIL);
    await flush();

    expect(resetTokens.rows.size).toBe(1);
    expect(email.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: EMAIL, html: expect.stringContaining('/reset-password?token=') }),
    );
  });

  it('never stores the raw token, only its hash', async () => {
    const { service, resetTokens, email } = buildService(buildUser());

    await service.requestReset(EMAIL);
    await flush();

    const sentLink = (email.sendMail as jest.Mock).mock.calls[0][0].html as string;
    const rawToken = /token=([0-9a-f]+)/.exec(sentLink)?.[1];

    expect(rawToken).toBeDefined();
    expect([...resetTokens.rows.keys()]).not.toContain(rawToken);
  });

  it('resolves without creating a token or sending an email for an unknown address', async () => {
    const { service, resetTokens, email } = buildService(null);

    await service.requestReset('nobody@needle.local');
    await flush();

    expect(resetTokens.rows.size).toBe(0);
    expect(email.sendMail).not.toHaveBeenCalled();
  });

  it('resolves without side effects for an INACTIVE user', async () => {
    const { service, resetTokens, email } = buildService(buildUser({ status: UserStatus.INACTIVE }));

    await service.requestReset(EMAIL);
    await flush();

    expect(resetTokens.rows.size).toBe(0);
    expect(email.sendMail).not.toHaveBeenCalled();
  });

  it('invalidates a prior unused token when a new reset is requested', async () => {
    const { service, resetTokens } = buildService(buildUser());

    await service.requestReset(EMAIL);
    await flush();
    const [firstHash, firstRow] = [...resetTokens.rows.entries()][0];

    await service.requestReset(EMAIL);
    await flush();

    expect(resetTokens.rows.get(firstHash)?.usedAt).not.toBeNull();
    expect(firstRow).toBeDefined();
  });
});

describe('PasswordResetService.resetPassword', () => {
  async function requestAndExtractToken(service: PasswordResetService, email: EmailPort) {
    await service.requestReset(EMAIL);
    await flush();
    const link = (email.sendMail as jest.Mock).mock.calls[0][0].html as string;
    return /token=([0-9a-f]+)/.exec(link)![1];
  }

  it('sets the new password hash and revokes every session', async () => {
    const { service, users, refreshTokens, email } = buildService(buildUser());
    const rawToken = await requestAndExtractToken(service, email);

    await service.resetPassword(rawToken, 'NewPassword1');

    expect(users.updatePasswordHash).toHaveBeenCalledWith(USER_ID, expect.any(String));
    const newHash = (users.updatePasswordHash as jest.Mock).mock.calls[0][1] as string;
    await expect(compare('NewPassword1', newHash)).resolves.toBe(true);
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects an unknown token', async () => {
    const { service } = buildService(buildUser());

    await expect(service.resetPassword('deadbeef', 'NewPassword1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a token twice — single use', async () => {
    const { service, email } = buildService(buildUser());
    const rawToken = await requestAndExtractToken(service, email);

    await service.resetPassword(rawToken, 'NewPassword1');

    await expect(service.resetPassword(rawToken, 'AnotherPass2')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects an expired token', async () => {
    const { service, resetTokens, email } = buildService(buildUser());
    const rawToken = await requestAndExtractToken(service, email);

    for (const row of resetTokens.rows.values()) {
      row.expiresAt = new Date(Date.now() - 1000);
    }

    await expect(service.resetPassword(rawToken, 'NewPassword1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
