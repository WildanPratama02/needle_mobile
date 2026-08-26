import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';

import { EmailModule } from '../../integrations/email/email.module';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { TokenService } from './services/token.service';
import { UserService } from './services/user.service';
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
    // Scoped to forgot-password/reset-password via a local @UseGuards, not the
    // global APP_GUARD set — /auth/login throttling is a separate, already
    // tracked gap (Docs/architecture/backend-webapps-action-plan.md HIGH-2).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 5 }]),
    EmailModule,
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    TokenService,
    PasswordResetService,
    UserService,
    JwtStrategy,
    UserRepository,
    RefreshTokenRepository,
    PasswordResetTokenRepository,
  ],
  exports: [UserRepository],
})
export class IdentityModule {}
