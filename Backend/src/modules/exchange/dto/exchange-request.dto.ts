import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeState, FragmentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExchangeDto {
  @ApiProperty({ example: 'mobile-device-uuid-000001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientTransactionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  trolleyId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  deviceId!: string;
}

/**
 * Either identifier works. `rfidUid` is what a tap actually produces; when both
 * arrive the backend still resolves the card and rejects a mismatch, since the
 * client is never trusted to have paired them correctly (ADR-004).
 */
export class IdentifyOperatorDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'RFID-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  rfidUid?: string;
}

export class SelectExchangeTypeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  exchangeTypeId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  oldNeedleTypeId!: string;
}

export class RecordFragmentDto {
  @ApiProperty({
    enum: FragmentStatus,
    description:
      'FOUND or NOT_FOUND only. NOT_REQUIRED does not exist: BENT and CHANGEOVER skip this step entirely.',
  })
  @IsEnum(FragmentStatus)
  fragmentStatus!: FragmentStatus;
}

export class SelectNewNeedleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  needleTypeId!: string;
}

export class IssueNeedleDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CancelExchangeDto {
  @ApiProperty({ example: 'Operator cancelled transaction' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  reason!: string;
}

export class ListExchangesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trolleyId?: string;

  /**
   * Validated against the enum rather than accepted as a free string.
   *
   * It used to be `@IsString()`, and the service then cast it straight into a
   * Prisma filter — so a value outside the enum escaped the DTO whitelist, the
   * request's only input boundary, and failed inside the ORM as a 500. The
   * published enum listed three of the twelve real states, which was the half a
   * client actually saw: valid filters documented as invalid.
   */
  @ApiPropertyOptional({ enum: ExchangeState, description: 'Exchange state' })
  @IsOptional()
  @IsEnum(ExchangeState)
  status?: ExchangeState;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
