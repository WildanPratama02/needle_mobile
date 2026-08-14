import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfirmationStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/**
 * Trims before validation, so whitespace-only input fails `@IsNotEmpty` with a
 * 400 instead of reaching the database CHECK and surfacing as a 500.
 */
const trimmed = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export class ApproveConfirmationDto {
  @ApiPropertyOptional({
    example: 'Supervisor confirmed broken fragment is unavailable.',
    description: 'Optional on approval; mandatory on rejection.',
  })
  @IsOptional()
  @IsString()
  @trimmed()
  reason?: string;
}

/**
 * `reason` is required here, not optional as on approval — Docs/11 §19 and a
 * database CHECK both refuse a rejection without one, so rejecting it at the
 * DTO gives the caller a 400 with a useful message instead of a 500.
 */
export class RejectConfirmationDto {
  @ApiProperty({ example: 'Fragment must be located before exchange can continue.' })
  @IsString()
  @IsNotEmpty()
  @trimmed()
  reason!: string;
}

export class ListConfirmationsQueryDto {
  @ApiPropertyOptional({ enum: ConfirmationStatus })
  @IsOptional()
  @IsEnum(ConfirmationStatus)
  status?: ConfirmationStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

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
