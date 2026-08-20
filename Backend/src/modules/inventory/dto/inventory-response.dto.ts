import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '@prisma/client';

/** Docs/12 §823 — no `id`, `factoryId` or `trolleyId` on the wire, by contract. */
export class BalanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  locationId!: string;

  @ApiProperty({ format: 'uuid' })
  needleTypeId!: string;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 0 })
  reservedQuantity!: number;

  @ApiProperty({ example: 100 })
  availableQuantity!: number;
}

export class PagedBalancesDto {
  @ApiProperty({ type: [BalanceResponseDto] })
  items!: BalanceResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

/** `NORMAL` / `LOW` / `OUT` — spec decision #11, banded off the needle type's Minimum Stock. */
export type StockStatus = 'NORMAL' | 'LOW' | 'OUT';

export class TrolleyStockItemDto {
  @ApiProperty({ format: 'uuid' })
  needleTypeId!: string;

  @ApiProperty({ example: 'DBX1' })
  needleTypeCode!: string;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 20 })
  minimumStock!: number;

  @ApiProperty({ example: 'NORMAL', enum: ['NORMAL', 'LOW', 'OUT'] })
  stockStatus!: StockStatus;
}

export class TrolleyStockResponseDto {
  @ApiProperty({ format: 'uuid' })
  trolleyId!: string;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ type: [TrolleyStockItemDto] })
  items!: TrolleyStockItemDto[];
}

export class MovementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'MV-20260820-000001' })
  movementNumber!: string;

  @ApiProperty({ enum: MovementType })
  movementType!: MovementType;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourceLocationId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  destinationLocationId!: string | null;

  @ApiProperty({ format: 'uuid' })
  needleTypeId!: string;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 'RECEIVING' })
  referenceType!: string;

  @ApiProperty({ format: 'uuid' })
  referenceId!: string;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty({ format: 'uuid' })
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class PagedMovementsDto {
  @ApiProperty({ type: [MovementResponseDto] })
  items!: MovementResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export class ReceivingResponseDto {
  @ApiProperty({ format: 'uuid' })
  movementId!: string;

  @ApiProperty({ example: 'MV-20260820-000001' })
  movementNumber!: string;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  destinationLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  needleTypeId!: string;

  @ApiProperty({ example: 500 })
  quantity!: number;

  @ApiProperty({ example: 500, description: 'Destination balance after this receiving.' })
  balanceQuantity!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class TransferResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Shared referenceId pairing the OUT/IN movement rows.',
  })
  transferId!: string;

  @ApiProperty({ example: 'MV-20260820-000002' })
  outMovementNumber!: string;

  @ApiProperty({ example: 'MV-20260820-000003' })
  inMovementNumber!: string;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  sourceLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  destinationLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  needleTypeId!: string;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 400 })
  sourceBalanceQuantity!: number;

  @ApiProperty({ example: 100 })
  destinationBalanceQuantity!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class AdjustmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  movementId!: string;

  @ApiProperty({ example: 'MV-20260820-000004' })
  movementNumber!: string;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  locationId!: string;

  @ApiProperty({ format: 'uuid' })
  needleTypeId!: string;

  @ApiProperty({ example: 100, description: 'Balance before this adjustment.' })
  systemQuantity!: number;

  @ApiProperty({ example: 95, description: 'Physically-counted quantity from the request.' })
  actualQuantity!: number;

  @ApiProperty({ example: -5 })
  varianceQuantity!: number;

  @ApiProperty({ example: 'Physical count variance' })
  reason!: string;

  @ApiProperty()
  createdAt!: Date;
}
