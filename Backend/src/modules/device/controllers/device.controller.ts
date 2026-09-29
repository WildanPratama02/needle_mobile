import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Device } from '@prisma/client';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import {
  CurrentDevice,
  RequireDeviceContext,
} from '../../../common/decorators/device-context.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainException, ERROR_CODES } from '../../../common/errors/domain.exception';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { DeviceContext } from '../../../common/interfaces/device-context.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  DeviceActionDto,
  HeartbeatDto,
  ReassignDeviceDto,
  RegisterDeviceDto,
} from '../dto/device-request.dto';
import { DeviceQueryDto } from '../dto/device-query.dto';
import { DeviceResponseDto, HeartbeatResponseDto } from '../dto/device-response.dto';
import { DeviceService } from '../services/device.service';

const NOT_FOUND = { status: 404, description: 'No such device' };
const FORBIDDEN = {
  status: 403,
  description: 'Missing DEVICE_MANAGE, or outside factory/location scope',
};
const BAD_TROLLEY = { status: 400, description: 'trolleyId does not belong to factoryId' };

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * Device lifecycle (`.scratch/device-and-inventory/spec.md`, GAP-13 Phase 1)
 * — the twelfth domain module `Backend/CLAUDE.md` §3 already named and left
 * empty. `DEVICE_MANAGE` gates every route here, read and write alike; there
 * is no separate `DEVICE_VIEW` code (spec's Implementation Decisions).
 *
 * `POST /devices/:id/heartbeat` is the exception: a tablet route, gated by
 * `MOBILE_OPERATE` and the device context rather than `DEVICE_MANAGE`
 * (`.scratch/mobile-backend` issue 06).
 */
@ApiTags('devices')
@ApiBearerAuth()
@Controller({ path: 'devices', version: '1' })
export class DeviceController {
  constructor(private readonly devices: DeviceService) {}

  static toResponse(row: Device): DeviceResponseDto {
    return {
      id: row.id,
      deviceCode: row.deviceCode,
      deviceName: row.deviceName,
      serialNumber: row.serialNumber,
      factoryId: row.factoryId,
      trolleyId: row.trolleyId,
      status: row.status,
      appVersion: row.appVersion,
      lastSeenAt: row.lastSeenAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DEVICE_MANAGE)
  @Paginated()
  @ApiOperation({ summary: 'List devices within the caller factory/location scope' })
  @ApiResponse({ status: 200, type: [DeviceResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: DeviceQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.devices.findMany(query, user);
    return { items: items.map((item) => DeviceController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DEVICE_MANAGE)
  @ApiOperation({ summary: 'Fetch one device' })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return DeviceController.toResponse(await this.devices.findOne(id, user));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DEVICE_MANAGE)
  @Audit(AUDIT_ACTIONS.DEVICE_BIND, 'Device')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a device against a factory and trolley',
    description:
      'trolleyId must belong to factoryId — rejected with 400 otherwise (Device story 7).',
  })
  @ApiResponse({ status: 201, type: DeviceResponseDto })
  @ApiResponse(BAD_TROLLEY)
  @ApiResponse({ status: 409, description: 'deviceCode or serialNumber already in use' })
  async register(@Body() dto: RegisterDeviceDto, @CurrentUser() user: AuthenticatedUser) {
    return DeviceController.toResponse(await this.devices.register(dto, user));
  }

  @Post(':id/activate')
  @RequirePermissions(PERMISSIONS.DEVICE_MANAGE)
  @Audit(AUDIT_ACTIONS.DEVICE_BIND, 'Device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a previously revoked (or inactive) device' })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async activate(
    @Param('id', uuid()) id: string,
    @Body() dto: DeviceActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return DeviceController.toResponse(await this.devices.activate(id, user));
  }

  @Post(':id/revoke')
  @RequirePermissions(PERMISSIONS.DEVICE_MANAGE)
  @Audit(AUDIT_ACTIONS.DEVICE_REVOKE, 'Device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a device so it can no longer authenticate' })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async revoke(
    @Param('id', uuid()) id: string,
    @Body() dto: DeviceActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return DeviceController.toResponse(await this.devices.revoke(id, user));
  }

  @Post(':id/reassign')
  @RequirePermissions(PERMISSIONS.DEVICE_MANAGE)
  @Audit(AUDIT_ACTIONS.DEVICE_BIND, 'Device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move a device to a different trolley/factory, in place',
    description:
      'Same trolleyId-belongs-to-factoryId validation as registration (Device story 11). No revoke/re-register round trip.',
  })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  @ApiResponse(BAD_TROLLEY)
  async reassign(
    @Param('id', uuid()) id: string,
    @Body() dto: ReassignDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return DeviceController.toResponse(await this.devices.reassign(id, dto, user));
  }

  @Post(':id/heartbeat')
  @RequirePermissions(PERMISSIONS.MOBILE_OPERATE)
  @RequireDeviceContext()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tablet heartbeat: records lastSeenAt and appVersion, returns server time',
    description:
      'The path id must equal X-Device-ID (403 DEVICE_MISMATCH). A revoked or inactive device gets 403 DEVICE_INACTIVE.',
  })
  @ApiResponse({ status: 200, type: HeartbeatResponseDto })
  @ApiResponse({ status: 403, description: 'DEVICE_INACTIVE, DEVICE_MISMATCH, or out of scope' })
  async heartbeat(
    @Param('id', uuid()) id: string,
    @Body() dto: HeartbeatDto,
    @CurrentDevice() context: DeviceContext,
  ): Promise<HeartbeatResponseDto> {
    if (id !== context.device.id) {
      throw new DomainException(
        ERROR_CODES.DEVICE_MISMATCH,
        'A device may only report its own heartbeat',
        HttpStatus.FORBIDDEN,
      );
    }

    const { device, serverTime, clockOffsetMs } = await this.devices.heartbeat(context.device, dto);

    return {
      deviceId: device.id,
      status: device.status,
      lastSeenAt: device.lastSeenAt!,
      serverTime,
      clockOffsetMs,
    };
  }
}
