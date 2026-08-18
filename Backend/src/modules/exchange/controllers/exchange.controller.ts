import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  CancelExchangeDto,
  CreateExchangeDto,
  IdentifyOperatorDto,
  IssueNeedleDto,
  ListExchangesQueryDto,
  RecordFragmentDto,
  SelectExchangeTypeDto,
  SelectNewNeedleDto,
} from '../dto/exchange-request.dto';
import { ExchangeResponseDto, PagedExchangesDto } from '../dto/exchange-response.dto';
import { ExchangeWithContext } from '../repositories/exchange.repository';
import { ExchangeService } from '../services/exchange.service';

/**
 * One endpoint per state transition, paths per Docs/12 (canonical — Docs/09's
 * exchange section is stale, round 4 Q4).
 *
 * Not here on purpose:
 *   - `POST /exchanges/{id}/evidence` -> issue 07 (MinIO adapter owns it)
 *   - `POST /exchanges/{id}/cancel`   -> issue 09 (with stock reversal)
 *   - confirmation approve / reject   -> issue 06
 *
 * Controllers orchestrate only (Backend/CLAUDE.md §7); every rule lives in
 * ExchangeService and the state machine.
 */
@ApiTags('exchanges')
@ApiBearerAuth()
@Controller({ path: 'exchanges', version: '1' })
export class ExchangeController {
  constructor(private readonly exchanges: ExchangeService) {}

  /** Shapes the entity for the wire; `state` is exposed as `status` per Docs/12. */
  private static toResponse(exchange: ExchangeWithContext): ExchangeResponseDto {
    return {
      id: exchange.id,
      exchangeNumber: exchange.exchangeNumber,
      status: exchange.state,
      factoryId: exchange.factoryId,
      trolleyId: exchange.trolleyId,
      deviceId: exchange.deviceId,
      operatorId: exchange.operatorId,
      exchangeTypeId: exchange.exchangeTypeId,
      // `exchangeType` is eager-loaded on every read because the state machine
      // needs it to judge fragment rules — these labels were being loaded and
      // then discarded. Reading them here costs no additional query.
      exchangeTypeCode: exchange.exchangeType?.code ?? null,
      exchangeTypeName: exchange.exchangeType?.name ?? null,
      oldNeedleTypeId: exchange.oldNeedleTypeId,
      newNeedleTypeId: exchange.newNeedleTypeId,
      fragmentStatus: exchange.fragmentStatus,
      confirmationId: exchange.confirmation?.id ?? null,
      createdAt: exchange.createdAt,
      completedAt: exchange.completedAt,
      cancelledAt: exchange.cancelledAt,
    };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @Audit(AUDIT_ACTIONS.CREATE_EXCHANGE, 'Exchange')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open an exchange (CREATED)' })
  @ApiResponse({ status: 201, type: ExchangeResponseDto })
  async create(
    @Body() dto: CreateExchangeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.create(dto, user));
  }

  @Post(':id/operator')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Identify the operator by RFID (CREATED -> OPERATOR_IDENTIFIED)' })
  @ApiResponse({ status: 409, description: 'Transition not valid from the current state' })
  async identifyOperator(
    @Param('id') id: string,
    @Body() dto: IdentifyOperatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.identifyOperator(id, dto, user));
  }

  @Post(':id/type')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Select old needle and exchange type (OPERATOR_IDENTIFIED -> EXCHANGE_TYPE_SELECTED)',
    description: 'Writes the transient NEEDLE_SELECTED state in the same transaction.',
  })
  async selectType(
    @Param('id') id: string,
    @Body() dto: SelectExchangeTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.selectType(id, dto, user));
  }

  @Post(':id/fragment')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record fragment status (BROKEN only)',
    description:
      'FOUND stops at FRAGMENT_CHECK. NOT_FOUND continues to CONFIRMATION_PENDING and raises a Confirmation.',
  })
  async recordFragment(
    @Param('id') id: string,
    @Body() dto: RecordFragmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.recordFragment(id, dto, user));
  }

  @Post(':id/new-needle')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Select the replacement needle (EVIDENCE_CAPTURED -> NEW_NEEDLE_SELECTED)',
  })
  async selectNewNeedle(
    @Param('id') id: string,
    @Body() dto: SelectNewNeedleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.selectNewNeedle(id, dto, user));
  }

  @Post(':id/issue')
  @RequirePermissions(PERMISSIONS.EXCHANGE_ISSUE)
  @Audit(AUDIT_ACTIONS.ISSUE_NEEDLE, 'Exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue the new needle (NEW_NEEDLE_SELECTED -> NEEDLE_ISSUED)',
    description: 'Decrements trolley stock and writes an ISSUE ledger entry in one transaction.',
  })
  @ApiResponse({ status: 409, description: 'Insufficient trolley stock' })
  async issueNeedle(
    @Param('id') id: string,
    @Body() dto: IssueNeedleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.issueNeedle(id, dto, user));
  }

  @Post(':id/store-used-needle')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Store the used needle (NEEDLE_ISSUED -> USED_NEEDLE_STORED)' })
  async storeUsedNeedle(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.storeUsedNeedle(id, user));
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.EXCHANGE_COMPLETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete the exchange (USED_NEEDLE_STORED -> COMPLETED)' })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.complete(id, user));
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CANCEL)
  @Audit(AUDIT_ACTIONS.CANCEL_EXCHANGE, 'Exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel the exchange (any non-terminal state -> CANCELLED)',
    description:
      'Past NEEDLE_ISSUED the issued quantity is returned to the trolley as a REVERSAL movement; the original ISSUE row is kept (Docs/02 §22-23).',
  })
  @ApiResponse({ status: 409, description: 'Exchange is already COMPLETED or CANCELLED' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelExchangeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.cancel(id, dto, user));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EXCHANGE_VIEW)
  @ApiOperation({ summary: 'Fetch one exchange' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExchangeResponseDto> {
    return ExchangeController.toResponse(await this.exchanges.findOne(id, user));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.EXCHANGE_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List exchanges within the caller factory scope',
    description: 'Items arrive in `data`; page counters in `meta` (Docs/12 §7).',
  })
  @ApiResponse({ status: 200, type: [ExchangeResponseDto] })
  async findMany(
    @Query() query: ListExchangesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedExchangesDto> {
    const { items, total } = await this.exchanges.findMany(query, user);

    return {
      items: items.map((item) => ExchangeController.toResponse(item)),
      total,
      page: query.page ?? 1,
      pageSize: Math.min(query.pageSize ?? 20, 100),
    };
  }
}
