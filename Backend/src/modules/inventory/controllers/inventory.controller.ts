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
import { StockMovement } from '@prisma/client';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  CreateAdjustmentDto,
  CreateReceivingDto,
  CreateTransferDto,
} from '../dto/inventory-request.dto';
import { ListBalancesQueryDto, ListMovementsQueryDto } from '../dto/inventory-query.dto';
import {
  AdjustmentResponseDto,
  BalanceResponseDto,
  MovementResponseDto,
  PagedBalancesDto,
  PagedMovementsDto,
  ReceivingResponseDto,
  TransferResponseDto,
  TrolleyStockResponseDto,
} from '../dto/inventory-response.dto';
import { BalanceRow, InventoryService } from '../services/inventory.service';

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * Docs/12 §13 — 6 of the 11 documented routes (spec decision #2). Return and
 * Physical Count have no WebApps screen behind them and stay out of scope.
 *
 * One controller for the whole `/inventory` prefix rather than one-per-route
 * class (contrast Master Data): these six routes are one resource — the
 * stock ledger — not six independent collections.
 */
@ApiTags('inventory')
@ApiBearerAuth()
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  private static toBalanceResponse(row: BalanceRow): BalanceResponseDto {
    return {
      locationId: row.locationId,
      needleTypeId: row.needleTypeId,
      quantity: row.quantity,
      reservedQuantity: row.reservedQuantity,
      availableQuantity: row.quantity - row.reservedQuantity,
    };
  }

  private static toMovementResponse(row: StockMovement): MovementResponseDto {
    return {
      id: row.id,
      movementNumber: row.movementNumber,
      movementType: row.movementType,
      factoryId: row.factoryId,
      sourceLocationId: row.sourceLocationId,
      destinationLocationId: row.destinationLocationId,
      needleTypeId: row.needleTypeId,
      quantity: Number(row.quantity),
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      reason: row.reason,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }

  @Get('balances')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List stock balances within the caller factory scope' })
  @ApiResponse({ status: 200, type: [BalanceResponseDto] })
  async findBalances(
    @Query() query: ListBalancesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedBalancesDto> {
    const { items, ...page } = await this.inventory.findBalances(query, user);
    return { items: items.map((item) => InventoryController.toBalanceResponse(item)), ...page };
  }

  @Get('trolleys/:trolleyId')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Per-needle-type stock for one trolley' })
  @ApiResponse({ status: 200, type: TrolleyStockResponseDto })
  @ApiResponse({ status: 404, description: 'No such trolley' })
  async findTrolleyStock(
    @Param('trolleyId', uuid()) trolleyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TrolleyStockResponseDto> {
    return this.inventory.findTrolleyStock(trolleyId, user);
  }

  @Get('movements')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List stock movements within the caller factory scope',
    description:
      'referenceType/referenceId render as plain columns — no drill-through this batch (spec decision #9).',
  })
  @ApiResponse({ status: 200, type: [MovementResponseDto] })
  async findMovements(
    @Query() query: ListMovementsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedMovementsDto> {
    const { items, ...page } = await this.inventory.findMovements(query, user);
    return { items: items.map((item) => InventoryController.toMovementResponse(item)), ...page };
  }

  @Post('receivings')
  @RequirePermissions(PERMISSIONS.STOCK_RECEIVE)
  @Audit(AUDIT_ACTIONS.RECEIVE_STOCK, 'StockMovement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Receive stock into a location' })
  @ApiResponse({ status: 201, type: ReceivingResponseDto })
  async receiveStock(
    @Body() dto: CreateReceivingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReceivingResponseDto> {
    return this.inventory.receiveStock(dto, user);
  }

  @Post('transfers')
  @RequirePermissions(PERMISSIONS.STOCK_TRANSFER)
  @Audit(AUDIT_ACTIONS.TRANSFER_STOCK, 'StockMovement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transfer stock between two locations in the same factory' })
  @ApiResponse({ status: 201, type: TransferResponseDto })
  @ApiResponse({ status: 409, description: 'Insufficient stock at sourceLocationId' })
  async transferStock(
    @Body() dto: CreateTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.inventory.transferStock(dto, user);
  }

  @Post('adjustments')
  @RequirePermissions(PERMISSIONS.STOCK_ADJUST)
  @Audit(AUDIT_ACTIONS.ADJUST_STOCK, 'StockMovement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reconcile a location balance to a physically-counted quantity',
    description:
      'Applies immediately — no approval step (CONTEXT.md: Adjustment, spec decision #3).',
  })
  @ApiResponse({ status: 201, type: AdjustmentResponseDto })
  async adjustStock(
    @Body() dto: CreateAdjustmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdjustmentResponseDto> {
    return this.inventory.adjustStock(dto, user);
  }
}
