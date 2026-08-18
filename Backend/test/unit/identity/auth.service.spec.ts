import { UnauthorizedException } from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

import { AuthService } from '../../../src/modules/identity/services/auth.service';
import { TokenService } from '../../../src/modules/identity/services/token.service';
import { UserRepository } from '../../../src/modules/identity/repositories/user.repository';

const PASSWORD = 'CorrectHorse1!';

async function buildUser(overrides: Partial<User> = {}): Promise<User> {
  return {
    id: 'user-1',
    username: 'admin',
    name: 'System Admin',
    email: 'admin@needle.local',
    passwordHash: await hash(PASSWORD, 4),
    status: UserStatus.ACTIVE,
    // Added to the model by the notifications migration; the fixture was never
    // updated, so `phoneNumber` came only from `overrides` and typed as
    // possibly-undefined against a `User` that requires it.
    phoneNumber: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildService(user: User | null) {
  const users = {
    findByUsername: jest.fn().mockResolvedValue(user),
    touchLastLogin: jest.fn().mockResolvedValue(undefined),
    loadAuthenticatedUser: jest.fn().mockResolvedValue(
      user
        ? {
            id: user.id,
            username: user.username,
            name: user.name,
            roles: ['SYSTEM_ADMIN'],
            permissions: ['USER_MANAGE'],
            factoryIds: [],
            locationIds: [],
          }
        : null,
    ),
  };

  const tokens = {
    issuePair: jest
      .fn()
      .mockResolvedValue({ accessToken: 'jwt', refreshToken: 'opaque', expiresIn: 900 }),
    rotate: jest.fn(),
    revoke: jest.fn().mockResolvedValue(undefined),
  };

  const service = new AuthService(
    users as unknown as UserRepository,
    tokens as unknown as TokenService,
  );

  return { service, users, tokens };
}

describe('AuthService.login', () => {
  it('returns a token pair and the user summary on valid credentials', async () => {
    const { service, users } = buildService(await buildUser());

    const result = await service.login({ username: 'admin', password: PASSWORD });

    expect(result.accessToken).toBe('jwt');
    expect(result.expiresIn).toBe(900);
    expect(result.user).toEqual({
      id: 'user-1',
      username: 'admin',
      name: 'System Admin',
      roles: ['SYSTEM_ADMIN'],
    });
    expect(users.touchLastLogin).toHaveBeenCalledWith('user-1');
  });

  it('rejects a wrong password', async () => {
    const { service, tokens } = buildService(await buildUser());

    await expect(service.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(tokens.issuePair).not.toHaveBeenCalled();
  });

  // FR-AUTH-001: inactive users are rejected even with the right password.
  it('rejects an INACTIVE user holding valid credentials', async () => {
    const { service } = buildService(await buildUser({ status: UserStatus.INACTIVE }));

    await expect(service.login({ username: 'admin', password: PASSWORD })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('gives the same message for unknown user and wrong password', async () => {
    const missing = buildService(null);
    const wrongPassword = buildService(await buildUser());

    const first = await missing.service
      .login({ username: 'nobody', password: PASSWORD })
      .catch((error: Error) => error.message);
    const second = await wrongPassword.service
      .login({ username: 'admin', password: 'wrong' })
      .catch((error: Error) => error.message);

    expect(first).toBe(second);
  });
});

describe('AuthService.me', () => {
  it('returns roles, permissions and scopes', async () => {
    const { service } = buildService(await buildUser());

    await expect(service.me('user-1')).resolves.toMatchObject({
      roles: ['SYSTEM_ADMIN'],
      permissions: ['USER_MANAGE'],
      factoryIds: [],
      locationIds: [],
    });
  });

  it('rejects once the user is deactivated', async () => {
    const { service } = buildService(null);

    await expect(service.me('user-1')).rejects.toThrow(UnauthorizedException);
  });
});
