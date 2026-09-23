import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  CurrentDevice,
  RequireDeviceContext,
} from '../../../common/decorators/device-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { DeviceContext } from '../../../common/interfaces/device-context.interface';
import { RequestWithContext } from '../../../common/interfaces/request-context.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { BootstrapQueryDto, SyncRequestDto } from '../dto/mobile-request.dto';
import { BootstrapResponseDto, SyncResponseDto } from '../dto/mobile-response.dto';
import { BootstrapService } from '../services/bootstrap.service';
import { SyncService } from '../services/sync.service';

const DEVICE_REFUSED = {
  status: 403,
  description: 'Missing MOBILE_OPERATE, DEVICE_INACTIVE, DEVICE_MISMATCH, or out of scope',
};

/**
 * The tablet's own surface (Docs/12 §18–19): bootstrap and offline sync.
 * Every route needs `MOBILE_OPERATE` and a valid device context.
 */
@ApiTags('mobile')
@ApiBearerAuth()
@Controller({ path: 'mobile', version: '1' })
export class MobileController {
  constructor(
    private readonly bootstrapService: BootstrapService,
    private readonly syncService: SyncService,
  ) {}

  @Get('bootstrap')
  @RequirePermissions(PERMISSIONS.MOBILE_OPERATE)
  @RequireDeviceContext()
  @ApiOperation({
    summary: 'Everything the tablet caches to work its trolley',
    description:
      'Factory and trolley come from the device binding. A collection whose version the tablet already holds comes back null.',
  })
  @ApiResponse({ status: 200, type: BootstrapResponseDto })
  @ApiResponse(DEVICE_REFUSED)
  bootstrap(
    @Query() query: BootstrapQueryDto,
    @CurrentDevice() device: DeviceContext,
  ): Promise<BootstrapResponseDto> {
    return this.bootstrapService.bootstrap(device, query);
  }

  @Post('sync')
  @RequirePermissions(PERMISSIONS.MOBILE_OPERATE)
  @RequireDeviceContext()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run queued exchange commands, then return what changed since the cursor',
    description:
      'Per-command results: SUCCESS, IDEMPOTENT_SUCCESS, REJECTED (business rule, do not auto-retry), FAILED (technical, retry), SKIPPED. Do not send Idempotency-Key on this request; each command is keyed by its commandId.',
  })
  @ApiResponse({ status: 200, type: SyncResponseDto })
  @ApiResponse({ status: 400, description: 'Malformed body or cursor, or more than 50 commands' })
  @ApiResponse(DEVICE_REFUSED)
  sync(
    @Body() dto: SyncRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentDevice() device: DeviceContext,
    @Req() request: RequestWithContext,
  ): Promise<SyncResponseDto> {
    return this.syncService.sync(dto, {
      user,
      device,
      requestId: request.requestId,
      path: request.originalUrl.split('?')[0],
    });
  }
}
