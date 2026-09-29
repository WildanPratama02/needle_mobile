import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockRelocationKind } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  ListAdjustmentsQueryDto,
  ListOperationHistoryQueryDto,
  ListReceivingsQueryDto,
} from '../dto/inventory-query.dto';
import {
  AdjustmentDetailResponseDto,
  AdjustmentHistoryResponseDto,
  PagedAdjustmentHistoryDto,
  PagedReceivingHistoryDto,
  PagedReturnHistoryDto,
  PagedTransferHistoryDto,
  ReceivingHistoryResponseDto,
  ReturnHistoryResponseDto,
  TransferHistoryResponseDto,
} from '../dto/inventory-response.dto';
import {
  AdjustmentDetail,
  AdjustmentRow,
  InventoryHistoryService,
  ReceivingRow,
  RelocationRow,
} from '../services/inventory-history.service';

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

const NOT_FOUND = { status: 404, description: 'No such record' };

/**
 * History of Transfer, Stock Return and Adjustment
 * (`.scratch/inventory-operation-history/spec.md`). Reads only, so every route
 * needs `STOCK_VIEW` — the same permission as the movement ledger — not the
 * write permission of the operation it lists.
 */
@ApiTags('inventory')
@ApiBearerAuth()
@Controller({ path: 'inventory', version: '1' })
export class InventoryHistoryController {
  constructor(private readonly history: InventoryHistoryService) {}

  static toReceiving(row: ReceivingRow): ReceivingHistoryResponseDto {
    return {
      id: row.id,
      movementNumber: row.movement.movementNumber,
      factoryId: row.factoryId,
      destinationLocationId: row.destinationLocationId,
      needleTypeId: row.needleTypeId,
      quantity: Number(row.quantity),
      supplierId: row.supplierId,
      receivedDate: row.receivedDate,
      referenceDocument: row.referenceDocument,
      note: row.note,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }

  private static relocationBase(row: RelocationRow) {
    return {
      id: row.id,
      factoryId: row.factoryId,
      sourceLocationId: row.sourceLocationId,
      destinationLocationId: row.destinationLocationId,
      needleTypeId: row.needleTypeId,
      quantity: Number(row.quantity),
      referenceDocument: row.referenceDocument,
      outMovementNumber: row.outMovement.movementNumber,
      inMovementNumber: row.inMovement.movementNumber,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }

  static toTransfer(row: RelocationRow): TransferHistoryResponseDto {
    return { ...InventoryHistoryController.relocationBase(row), note: row.note };
  }

  static toReturn(row: RelocationRow): ReturnHistoryResponseDto {
    return { ...InventoryHistoryController.relocationBase(row), reason: row.note ?? '' };
  }

  static toAdjustment(row: AdjustmentRow): AdjustmentHistoryResponseDto {
    return {
      id: row.id,
      movementNumber: row.movement.movementNumber,
      factoryId: row.factoryId,
      locationId: row.locationId,
      needleTypeId: row.needleTypeId,
      reasonCode: row.reasonCode,
      reason: row.note,
      systemQuantity: row.systemQuantity === null ? null : Number(row.systemQuantity),
      actualQuantity: row.actualQuantity === null ? null : Number(row.actualQuantity),
      varianceQuantity: Number(row.varianceQuantity),
      countSessionId: row.countSessionId,
      evidenceCount: row._count.evidence,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }

  static toAdjustmentDetail(row: AdjustmentDetail): AdjustmentDetailResponseDto {
    return {
      ...InventoryHistoryController.toAdjustment(row),
      evidence: row.evidence.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: Number(item.fileSize),
        createdAt: item.createdAt,
        url: item.url,
      })),
    };
  }

  @Get('receivings')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List receivings within the caller factory scope, newest first',
    description: 'Filterable by supplier; locationId matches the destination warehouse.',
  })
  @ApiResponse({ status: 200, type: [ReceivingHistoryResponseDto] })
  async findReceivings(
    @Query() query: ListReceivingsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedReceivingHistoryDto> {
    const { items, ...page } = await this.history.findReceivings(query, user);
    return { items: items.map((row) => InventoryHistoryController.toReceiving(row)), ...page };
  }

  @Get('receivings/:id')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Fetch one receiving' })
  @ApiResponse({ status: 200, type: ReceivingHistoryResponseDto })
  @ApiResponse(NOT_FOUND)
  async findReceiving(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReceivingHistoryResponseDto> {
    return InventoryHistoryController.toReceiving(await this.history.findReceiving(id, user));
  }

  @Get('transfers')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List transfers within the caller factory scope, newest first' })
  @ApiResponse({ status: 200, type: [TransferHistoryResponseDto] })
  async findTransfers(
    @Query() query: ListOperationHistoryQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedTransferHistoryDto> {
    const { items, ...page } = await this.history.findRelocations(
      StockRelocationKind.TRANSFER,
      query,
      user,
    );
    return { items: items.map((row) => InventoryHistoryController.toTransfer(row)), ...page };
  }

  @Get('transfers/:id')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Fetch one transfer' })
  @ApiResponse({ status: 200, type: TransferHistoryResponseDto })
  @ApiResponse(NOT_FOUND)
  async findTransfer(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferHistoryResponseDto> {
    return InventoryHistoryController.toTransfer(
      await this.history.findRelocation(StockRelocationKind.TRANSFER, id, user),
    );
  }

  @Get('returns')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List stock returns within the caller factory scope, newest first' })
  @ApiResponse({ status: 200, type: [ReturnHistoryResponseDto] })
  async findReturns(
    @Query() query: ListOperationHistoryQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedReturnHistoryDto> {
    const { items, ...page } = await this.history.findRelocations(
      StockRelocationKind.RETURN,
      query,
      user,
    );
    return { items: items.map((row) => InventoryHistoryController.toReturn(row)), ...page };
  }

  @Get('returns/:id')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Fetch one stock return' })
  @ApiResponse({ status: 200, type: ReturnHistoryResponseDto })
  @ApiResponse(NOT_FOUND)
  async findReturn(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReturnHistoryResponseDto> {
    return InventoryHistoryController.toReturn(
      await this.history.findRelocation(StockRelocationKind.RETURN, id, user),
    );
  }

  @Get('adjustments')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List adjustments within the caller factory scope, newest first',
    description: 'Includes the adjustments a completed count session wrote (countSessionId set).',
  })
  @ApiResponse({ status: 200, type: [AdjustmentHistoryResponseDto] })
  async findAdjustments(
    @Query() query: ListAdjustmentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedAdjustmentHistoryDto> {
    const { items, ...page } = await this.history.findAdjustments(query, user);
    return { items: items.map((row) => InventoryHistoryController.toAdjustment(row)), ...page };
  }

  @Get('adjustments/:id')
  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @ApiOperation({ summary: 'Fetch one adjustment with its evidence' })
  @ApiResponse({ status: 200, type: AdjustmentDetailResponseDto })
  @ApiResponse(NOT_FOUND)
  async findAdjustment(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdjustmentDetailResponseDto> {
    return InventoryHistoryController.toAdjustmentDetail(
      await this.history.findAdjustment(id, user),
    );
  }
}
