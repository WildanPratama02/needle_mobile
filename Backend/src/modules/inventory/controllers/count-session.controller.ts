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
import { CountSession } from '@prisma/client';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { ListCountSessionsQueryDto } from '../dto/inventory-query.dto';
import { AddCountItemDto, CreateCountSessionDto } from '../dto/inventory-request.dto';
import {
  CompleteCountSessionResponseDto,
  CountSessionDetailResponseDto,
  CountSessionResponseDto,
  PagedCountSessionsDto,
} from '../dto/inventory-response.dto';
import { CountSessionService, CountSessionWithItems } from '../services/count-session.service';

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

const NOT_FOUND = { status: 404, description: 'No such count session' };
const ALREADY_COMPLETED = { status: 409, description: 'Count session is already completed' };

/**
 * `Docs/12` §14 Physical Count (`.scratch/admin-panel-crud/issues/05`), plus a
 * list route §14 did not have. Every route requires `STOCK_COUNT`. Only
 * `complete` changes stock, so only `complete` is audited (`ADJUST_STOCK`).
 */
@ApiTags('inventory')
@ApiBearerAuth()
@Controller({ path: 'inventory/count-sessions', version: '1' })
export class CountSessionController {
  constructor(private readonly countSessions: CountSessionService) {}

  static toResponse(row: CountSession): CountSessionResponseDto {
    return {
      id: row.id,
      factoryId: row.factoryId,
      locationId: row.locationId,
      status: row.status,
      createdBy: row.createdBy,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    };
  }

  static toDetail(row: CountSessionWithItems): CountSessionDetailResponseDto {
    return {
      ...CountSessionController.toResponse(row),
      items: row.items.map((item) => {
        const systemQuantity = Number(item.systemQuantity);
        const physicalQuantity = Number(item.physicalQuantity);
        return {
          needleTypeId: item.needleTypeId,
          systemQuantity,
          physicalQuantity,
          varianceQuantity: physicalQuantity - systemQuantity,
        };
      }),
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.STOCK_COUNT)
  @Paginated()
  @ApiOperation({ summary: 'List count sessions within the caller factory scope, newest first' })
  @ApiResponse({ status: 200, type: [CountSessionResponseDto] })
  async findMany(
    @Query() query: ListCountSessionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedCountSessionsDto> {
    const { items, ...page } = await this.countSessions.findMany(query, user);
    return { items: items.map((item) => CountSessionController.toResponse(item)), ...page };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STOCK_COUNT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a count session for one location' })
  @ApiResponse({ status: 201, type: CountSessionDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Inactive factory, or location outside the factory' })
  async create(
    @Body() dto: CreateCountSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CountSessionDetailResponseDto> {
    return CountSessionController.toDetail(await this.countSessions.create(dto, user));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.STOCK_COUNT)
  @ApiOperation({ summary: 'Fetch one count session with its counted items' })
  @ApiResponse({ status: 200, type: CountSessionDetailResponseDto })
  @ApiResponse(NOT_FOUND)
  async findOne(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CountSessionDetailResponseDto> {
    return CountSessionController.toDetail(await this.countSessions.findOne(id, user));
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.STOCK_COUNT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a physical count for one needle type',
    description:
      'Captures the current balance as systemQuantity. Re-counting a needle type replaces it.',
  })
  @ApiResponse({ status: 200, type: CountSessionDetailResponseDto })
  @ApiResponse(NOT_FOUND)
  @ApiResponse(ALREADY_COMPLETED)
  async addItem(
    @Param('id', uuid()) id: string,
    @Body() dto: AddCountItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CountSessionDetailResponseDto> {
    return CountSessionController.toDetail(await this.countSessions.addItem(id, dto, user));
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.STOCK_COUNT)
  @Audit(AUDIT_ACTIONS.ADJUST_STOCK, 'CountSession')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete the session and reconcile variances',
    description:
      'Writes one ADJUSTMENT movement (referenceType COUNT_SESSION) per non-zero variance, atomically.',
  })
  @ApiResponse({ status: 200, type: CompleteCountSessionResponseDto })
  @ApiResponse({ status: 400, description: 'Nothing counted, or inactive factory' })
  @ApiResponse(NOT_FOUND)
  @ApiResponse({
    status: 409,
    description: 'Already completed, or a balance changed since it was counted',
  })
  async complete(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompleteCountSessionResponseDto> {
    const { session, adjustmentMovementIds } = await this.countSessions.complete(id, user);
    return {
      factoryId: session.factoryId,
      session: CountSessionController.toDetail(session),
      adjustmentMovementIds,
    };
  }
}
