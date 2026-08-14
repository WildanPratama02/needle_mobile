import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { compare } from 'bcryptjs';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { LoginDto } from '../dto/login.dto';
import { UserRepository } from '../repositories/user.repository';
import { TokenPair, TokenService } from './token.service';

export interface LoginResult extends TokenPair {
  user: {
    id: string;
    username: string;
    name: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
  ) {}

  async login(dto: LoginDto, deviceId?: string): Promise<LoginResult> {
    const user = await this.users.findByUsername(dto.username);

    // One message for every failure below. Distinguishing "no such user" from
    // "wrong password" hands an attacker a username oracle.
    const rejected = new UnauthorizedException('Invalid credentials');

    if (!user) {
      // Still compare against a dummy hash so a missing user does not return
      // measurably faster than a wrong password.
      await compare(
        dto.password,
        '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi',
      );
      throw rejected;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw rejected;
    }

    if (!(await compare(dto.password, user.passwordHash))) {
      throw rejected;
    }

    const pair = await this.tokens.issuePair(user, deviceId);
    await this.users.touchLastLogin(user.id);

    const authenticated = await this.users.loadAuthenticatedUser(user.id);

    return {
      ...pair,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles: authenticated?.roles ?? [],
      },
    };
  }

  refresh(refreshToken: string, deviceId?: string): Promise<TokenPair> {
    return this.tokens.rotate(
      refreshToken,
      async (userId) => {
        const user = await this.users.loadAuthenticatedUser(userId);
        return user ? { id: user.id, username: user.username } : null;
      },
      deviceId,
    );
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }

  /** Backs `GET /auth/me` — user, roles, permissions, factory and location scope. */
  async me(userId: string): Promise<AuthenticatedUser> {
    const user = await this.users.loadAuthenticatedUser(userId);

    if (!user) {
      throw new UnauthorizedException('User no longer active');
    }

    return user;
  }
}
