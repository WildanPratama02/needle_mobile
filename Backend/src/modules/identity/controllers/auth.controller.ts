import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { LoginResponseDto, MeResponseDto, TokenPairDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthService } from '../services/auth.service';

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
  constructor(private readonly authService: AuthService) {}

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
}
