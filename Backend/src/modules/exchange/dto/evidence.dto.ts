import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceStatus, EvidenceType, ExchangeState } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

export class UploadEvidenceDto {
  @ApiProperty({ enum: EvidenceType })
  @IsEnum(EvidenceType)
  evidenceType!: EvidenceType;

  @ApiPropertyOptional({
    description: 'When the photo was taken on the device. Defaults to now if omitted.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  capturedAt?: Date;
}

export class EvidenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  exchangeId!: string;

  @ApiProperty({ enum: EvidenceType })
  evidenceType!: EvidenceType;

  @ApiProperty({ example: 'exchanges/2026/08/<exchangeId>/<evidenceId>.jpg' })
  storageKey!: string;

  @ApiProperty({ enum: EvidenceStatus })
  status!: EvidenceStatus;

  @ApiPropertyOptional({ nullable: true })
  fileName!: string | null;

  @ApiProperty()
  mimeType!: string;

  @ApiPropertyOptional({ nullable: true })
  checksum!: string | null;

  @ApiProperty()
  capturedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  uploadedAt!: Date | null;
}

export class UploadEvidenceResponseDto extends EvidenceResponseDto {
  /** Advances to `EVIDENCE_CAPTURED` on the upload that completes the mandatory set. */
  @ApiProperty({ enum: ExchangeState })
  exchangeStatus!: ExchangeState;

  @ApiProperty({ enum: EvidenceType, isArray: true, description: 'Mandatory types still missing' })
  outstanding!: EvidenceType[];
}

export class EvidenceListItemDto extends EvidenceResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Short-lived presigned read URL; null until the upload succeeded.',
  })
  url!: string | null;
}
