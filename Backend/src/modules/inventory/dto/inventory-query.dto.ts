import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdjustmentReasonCode, CountSessionStatus, MovementType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Filters for `GET /inventory/balances` (Docs/12 §823). `trolleyId` resolves
 * to its own `locationId` in the service — a trolley is an inventory location
 * (ADR-003), not a separate dimension on the balance row.
 */
export class ListBalancesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trolleyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  needleTypeId?: string;

  @ApiPropertyOptional({
    description: 'Only rows where quantity <= the needle type Minimum Stock (CONTEXT.md).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Capped at 100.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

/** Filters for `GET /inventory/movements` (Docs/12 §873). */
export class ListMovementsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trolleyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  needleTypeId?: string;

  @ApiPropertyOptional({ enum: MovementType })
  @IsOptional()
  @IsEnum(MovementType)
  movementType?: MovementType;

  @ApiPropertyOptional({ example: 'EXCHANGE' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  referenceType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Inclusive lower bound on createdAt.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound on createdAt.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Capped at 100.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

/** Filters for `GET /inventory/count-sessions` — newest first. */
export class ListCountSessionsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Intersected with the caller scope.' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ enum: CountSessionStatus })
  @IsOptional()
  @IsEnum(CountSessionStatus)
  status?: CountSessionStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Capped at 100.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

/**
 * Filters for the Transfer and Return history lists
 * (`.scratch/inventory-operation-history/spec.md`). `locationId` matches
 * either end of the move.
 */
export class ListOperationHistoryQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Intersected with the caller scope.' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  needleTypeId?: string;

  @ApiPropertyOptional({ description: 'Inclusive lower bound on createdAt.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound on createdAt.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Capped at 100.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

/** Filters for `GET /inventory/adjustments`. */
export class ListAdjustmentsQueryDto extends ListOperationHistoryQueryDto {
  @ApiPropertyOptional({ enum: AdjustmentReasonCode })
  @IsOptional()
  @IsEnum(AdjustmentReasonCode)
  reasonCode?: AdjustmentReasonCode;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countSessionId?: string;
}
