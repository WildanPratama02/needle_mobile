import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { LoginResponseDto, MeResponseDto, TokenPairDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthService } from '../services/auth.service';
import { PasswordResetService } from '../services/password-reset.service';

/** Fixed wording regardless of whether the email matched an account (anti-enumeration). */
const FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, a reset link has been sent.';

/**
 * Controllers orchestrate only — validate, delegate, return
 * (Backend/CLAUDE.md §7). No auth logic lives here.
 *
 * `X-Device-ID` (Docs/12 §5) is recorded on the refresh token so a specific
 * tablet's sessions can be traced and revoked.
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange username and password for a token pair' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive user' })
  login(
    @Body() dto: LoginDto,
    @Headers('x-device-id') deviceId?: string,
  ): Promise<LoginResponseDto> {
    return this.authService.login(dto, deviceId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token into a new pair' })
  @ApiResponse({ status: 200, type: TokenPairDto })
  @ApiResponse({ status: 401, description: 'Token unknown, expired, or already used' })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('x-device-id') deviceId?: string,
  ): Promise<TokenPairDto> {
    return this.authService.refresh(dto.refreshToken, deviceId);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token' })
  @ApiResponse({ status: 204, description: 'Revoked, or already was' })
  logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user with roles, permissions and scopes' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return this.authService.me(user.id);
  }

  // Throttled locally rather than through the global guard set (Backend/CLAUDE.md
  // §4 login throttling is a separate, already-tracked gap — this scopes rate
  // limiting to the two endpoints this ticket adds).
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Generic response regardless of whether the email matched an account' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.passwordResetService.requestReset(dto.email);
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set a new password from a reset token' })
  @ApiResponse({ status: 200, description: 'Password changed; every existing session was revoked' })
  @ApiResponse({ status: 400, description: 'Token unknown, expired, or already used' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated. Sign in with your new password.' };
  }
}
