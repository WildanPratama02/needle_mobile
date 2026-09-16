import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  CreateReturnDto,
  CreateTransferDto,
  UploadAdjustmentEvidenceDto,
} from '../dto/inventory-request.dto';
import { ListBalancesQueryDto, ListMovementsQueryDto } from '../dto/inventory-query.dto';
import {
  AdjustmentEvidenceResponseDto,
  AdjustmentResponseDto,
  BalanceResponseDto,
  MovementResponseDto,
  PagedBalancesDto,
  PagedMovementsDto,
  ReceivingResponseDto,
  ReturnResponseDto,
  TransferResponseDto,
  TrolleyStockResponseDto,
} from '../dto/inventory-response.dto';
import { AdjustmentEvidenceService, EvidenceFile } from '../services/adjustment-evidence.service';
import { BalanceRow, InventoryService } from '../services/inventory.service';

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * Docs/12 §13 — the stock ledger's reads and writes. Return was added by
 * `.scratch/admin-panel-crud/issues/04`, reopening spec decision #2.
 *
 * One controller for the whole `/inventory` prefix rather than one-per-route
 * class (contrast Master Data): these routes are one resource — the stock
 * ledger — not independent collections.
 */
@ApiTags('inventory')
@ApiBearerAuth()
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly evidence: AdjustmentEvidenceService,
  ) {}

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

  @Post('returns')
  @RequirePermissions(PERMISSIONS.STOCK_RETURN)
  @Audit(AUDIT_ACTIONS.RETURN_STOCK, 'StockMovement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Return stock from one location to another in the same factory',
    description: 'Writes a pair of RETURN movements sharing returnId. reason is mandatory.',
  })
  @ApiResponse({ status: 201, type: ReturnResponseDto })
  @ApiResponse({ status: 400, description: 'Same source and destination, or inactive factory' })
  @ApiResponse({ status: 409, description: 'Insufficient stock at sourceLocationId' })
  async returnStock(
    @Body() dto: CreateReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReturnResponseDto> {
    return this.inventory.returnStock(dto, user);
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
  @ApiResponse({
    status: 400,
    description:
      'Missing note for OTHER, or an evidenceId that is not yours, not this factory, or already used',
  })
  async adjustStock(
    @Body() dto: CreateAdjustmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdjustmentResponseDto> {
    return this.inventory.adjustStock(dto, user);
  }

  /**
   * `multipart/form-data`, so the file never becomes a base64 payload in
   * JSON. Stored unattached until an adjustment cites it in `evidenceIds`.
   */
  @Post('adjustments/evidence')
  @RequirePermissions(PERMISSIONS.STOCK_ADJUST)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'factoryId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        factoryId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload one evidence file for a manual adjustment',
    description: 'JPEG, PNG, WebP or PDF, at most 10 MB.',
  })
  @ApiResponse({ status: 201, type: AdjustmentEvidenceResponseDto })
  @ApiResponse({ status: 400, description: 'No file, unsupported type, or too large' })
  async uploadAdjustmentEvidence(
    @Body() dto: UploadAdjustmentEvidenceDto,
    @UploadedFile() file: EvidenceFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdjustmentEvidenceResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }
    const row = await this.evidence.upload(dto.factoryId, file, user);
    return {
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileSize: Number(row.fileSize),
      createdAt: row.createdAt,
    };
  }
}
