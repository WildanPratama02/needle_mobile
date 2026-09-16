import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdjustmentReasonCode } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

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

  @ApiPropertyOptional({ example: 'DO-00012' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceDocument?: string;

  @ApiPropertyOptional({ example: 'Replenishment trolley' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * `reasonCode` is `Docs/02` §13's list; `reason` is the free-text note, required
 * only for `OTHER`. `evidenceIds` must name files the caller uploaded through
 * `POST /inventory/adjustments/evidence` for this factory and no adjustment
 * has claimed yet (`.scratch/inventory-operation-history/spec.md` decision 4).
 */
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

  @ApiProperty({ enum: AdjustmentReasonCode, example: AdjustmentReasonCode.DAMAGED })
  @IsEnum(AdjustmentReasonCode)
  reasonCode!: AdjustmentReasonCode;

  @ApiPropertyOptional({
    example: 'Bent needles found in drawer',
    description: 'Required when reasonCode is OTHER.',
  })
  @ValidateIf(
    (dto: CreateAdjustmentDto) =>
      dto.reasonCode === AdjustmentReasonCode.OTHER || dto.reason !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ format: 'uuid', isArray: true, minItems: 1, maxItems: 5 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  evidenceIds!: string[];
}

/** Multipart companion to the `file` part of `POST /inventory/adjustments/evidence`. */
export class UploadAdjustmentEvidenceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;
}

/**
 * `Docs/12` §13 `POST /inventory/returns` (`.scratch/admin-panel-crud/issues/04`).
 * Same shape as a transfer, except `reason` is mandatory — FR-WEB-013 asks
 * why stock went back, where a transfer's `note` is optional — and the
 * service only accepts a TROLLEY source and a WAREHOUSE destination
 * (`.scratch/inventory-operation-history/spec.md` decision 2).
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

  @ApiPropertyOptional({ example: 'RT-00007' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceDocument?: string;

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
