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
import { RfidCard } from '@prisma/client';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  CurrentDevice,
  RequireDeviceContext,
} from '../../../common/decorators/device-context.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { DeviceContext } from '../../../common/interfaces/device-context.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { EnrollRfidCardDto } from '../dto/rfid-request.dto';
import { RfidCardQueryDto } from '../dto/rfid-query.dto';
import { RfidCardResponseDto, RfidLookupResponseDto } from '../dto/rfid-response.dto';
import { RfidCardService } from '../services/rfid-card.service';

const NOT_FOUND = { status: 404, description: 'No such row' };
const FORBIDDEN = { status: 403, description: 'Missing MASTER_VIEW/MASTER_EDIT, or outside factory scope' };

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * RFID Card enroll/revoke — the admin-desktop side of RFID data entry
 * (`.scratch/master-data-storage-rfid/spec.md`) — plus the tablet's
 * operator lookup by physical UID (Doc 13 §8), which sits under `/uid/`
 * because `/rfid/cards/{id}` was already the card-id route.
 */
@ApiTags('rfid')
@ApiBearerAuth()
@Controller({ path: 'rfid/cards', version: '1' })
export class RfidController {
  constructor(private readonly rfidCards: RfidCardService) {}

  static toResponse(row: RfidCard): RfidCardResponseDto {
    return {
      id: row.id,
      rfidUid: row.rfidUid,
      employeeId: row.employeeId,
      status: row.status,
      issuedAt: row.issuedAt,
      revokedAt: row.revokedAt,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List RFID cards within the caller factory scope' })
  @ApiResponse({ status: 200, type: [RfidCardResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: RfidCardQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.rfidCards.findMany(query, user);
    return { items: items.map((item) => RfidController.toResponse(item)), ...page };
  }

  @Get('uid/:rfidUid')
  @RequirePermissions(PERMISSIONS.MOBILE_OPERATE)
  @RequireDeviceContext()
  @ApiOperation({
    summary: 'Identify an operator by the UID a tap produced (tablet)',
    description:
      'Resolves the ACTIVE card for the UID; the employee must be ACTIVE and in the device factory. Not audited — the resolution is audited when the operator step runs.',
  })
  @ApiResponse({ status: 200, type: RfidLookupResponseDto })
  @ApiResponse({ status: 404, description: 'RFID_NOT_FOUND' })
  @ApiResponse({ status: 422, description: 'RFID_INACTIVE or EMPLOYEE_INACTIVE' })
  @ApiResponse({ status: 403, description: 'FACTORY_SCOPE_DENIED, or device context refused' })
  async lookupByUid(
    @Param('rfidUid') rfidUid: string,
    @CurrentDevice() context: DeviceContext,
  ): Promise<RfidLookupResponseDto> {
    const card = await this.rfidCards.resolveForFactory(rfidUid.trim(), context.device.factoryId);

    return {
      employee: {
        id: card.employee.id,
        employeeNumber: card.employee.employeeNumber,
        name: card.employee.name,
        factoryId: card.employee.factoryId,
        status: card.employee.status,
      },
      rfidCard: { id: card.id, uid: card.rfidUid, status: card.status },
    };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one RFID card' })
  @ApiResponse({ status: 200, type: RfidCardResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return RfidController.toResponse(await this.rfidCards.findOne(id, user));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'RfidCard')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enroll an RFID card against an employee',
    description:
      'A UID already ACTIVE on another card is rejected (409); enrolling auto-revokes the ' +
      "employee's previous active card, if any.",
  })
  @ApiResponse({ status: 201, type: RfidCardResponseDto })
  @ApiResponse({ status: 409, description: 'rfidUid is already ACTIVE on another card' })
  async enroll(@Body() dto: EnrollRfidCardDto, @CurrentUser() user: AuthenticatedUser) {
    return RfidController.toResponse(
      await this.rfidCards.enroll(dto.employeeId, dto.rfidUid, user),
    );
  }

  @Post(':id/revoke')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'RfidCard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke an RFID card',
    description: 'Terminal — a revoked card cannot be un-revoked; reissue is a fresh enroll.',
  })
  @ApiResponse({ status: 200, type: RfidCardResponseDto })
  @ApiResponse(NOT_FOUND)
  @ApiResponse({ status: 409, description: 'Card is already revoked' })
  async revoke(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return RfidController.toResponse(await this.rfidCards.revoke(id, user));
  }
}
