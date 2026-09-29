import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { MAX_SYNC_COMMANDS, SYNC_COMMAND_TYPES, SyncCommandType } from '../sync.constants';

/** Versions the tablet already holds; an unchanged collection comes back `null`. */
export class BootstrapQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  needleTypesVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  exchangeTypesVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  storageMappingsVersion?: string;
}

export class SyncCommandDto {
  @ApiProperty({ description: 'Unique per command; its idempotency key', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  commandId!: string;

  @ApiProperty({
    description: "The exchange's key on the tablet — the one sent with CREATE_EXCHANGE",
    example: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientTransactionId!: string;

  @ApiProperty({ enum: SYNC_COMMAND_TYPES })
  @IsIn(SYNC_COMMAND_TYPES)
  commandType!: SyncCommandType;

  @ApiPropertyOptional({ description: 'Device time; kept in audit metadata only' })
  @IsOptional()
  @IsISO8601({ strict: true })
  occurredAt?: string;

  /**
   * Validated per command type by the sync engine, against the same DTO the
   * matching HTTP endpoint uses, so a bad payload rejects that one command
   * rather than the whole batch.
   */
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class SyncRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Must equal X-Device-ID' })
  @IsUUID()
  deviceId!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Opaque; from bootstrap or the last sync' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string | null;

  @ApiProperty({ type: [SyncCommandDto], maxItems: MAX_SYNC_COMMANDS })
  @IsArray()
  @ArrayMaxSize(MAX_SYNC_COMMANDS)
  @ValidateNested({ each: true })
  @Type(() => SyncCommandDto)
  commands!: SyncCommandDto[];
}
