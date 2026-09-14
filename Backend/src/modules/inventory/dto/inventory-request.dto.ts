import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateReceivingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  destinationLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  needleTypeId!: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'GR-00001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceDocument?: string;

  @ApiPropertyOptional({ example: 'Initial stock' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateTransferDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  destinationLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  needleTypeId!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Replenishment trolley' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  locationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  needleTypeId!: string;

  @ApiProperty({ example: 95, description: 'Physically-counted quantity.' })
  @IsInt()
  @Min(0)
  actualQuantity!: number;

  @ApiProperty({ example: 'Physical count variance' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

/**
 * `Docs/12` §13 `POST /inventory/returns` (`.scratch/admin-panel-crud/issues/04`).
 * Same shape as a transfer, except `reason` is mandatory — FR-WEB-013 asks
 * why stock went back, where a transfer's `note` is optional.
 */
export class CreateReturnDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  destinationLocationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  needleTypeId!: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'Excess stock' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

/** `Docs/12` §14 `POST /inventory/count-sessions` (`.scratch/admin-panel-crud/issues/05`). */
export class CreateCountSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid', description: 'The location being counted.' })
  @IsUUID()
  locationId!: string;
}

/** `Docs/12` §14 `POST /inventory/count-sessions/{id}/items`. Re-counting a needle type replaces it. */
export class AddCountItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  needleTypeId!: string;

  @ApiProperty({ example: 95, description: 'Physically-counted quantity.' })
  @IsInt()
  @Min(0)
  physicalQuantity!: number;
}
