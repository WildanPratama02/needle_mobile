import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/interfaces/authenticated-user.interface';
import { UserRepository } from '../repositories/user.repository';

/**
 * Verifies the access token, then rebuilds the caller's authorization state
 * from the database. What lands on `request.user` is an `AuthenticatedUser`,
 * which is what RbacGuard and ScopeGuard read.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // A refresh token is opaque and can never reach here, but reject anything
    // that is not explicitly an access token rather than trusting the shape.
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.users.loadAuthenticatedUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer active');
    }

    return user;
  }
}
