import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './controllers/auth.controller';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Foundation module — every other domain module depends on the guards and the
 * `AuthenticatedUser` this one produces.
 *
 * `UserRepository` is exported because JwtStrategy resolves the caller on every
 * request; nothing else should reach into it directly.
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Signing options are passed per call in TokenService so the secret is read
    // from validated config rather than captured at module registration.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy, UserRepository, RefreshTokenRepository],
  exports: [UserRepository],
})
export class IdentityModule {}
