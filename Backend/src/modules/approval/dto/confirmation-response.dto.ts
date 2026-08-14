import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfirmationDecisionType, ConfirmationStatus, ExchangeState } from '@prisma/client';

export class ConfirmationDecisionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ConfirmationDecisionType })
  decision!: ConfirmationDecisionType;

  @ApiProperty({ format: 'uuid' })
  decidedBy!: string;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  decidedAt!: Date;
}

export class ConfirmationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CNF-20260810-000001' })
  confirmationNumber!: string;

  @ApiProperty({ format: 'uuid' })
  exchangeId!: string;

  @ApiProperty({ example: 'EXC-20260810-000001' })
  exchangeNumber!: string;

  /** Where the exchange sits — a decided confirmation does not move it on its own. */
  @ApiProperty({ enum: ExchangeState })
  exchangeStatus!: ExchangeState;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ enum: ConfirmationStatus })
  status!: ConfirmationStatus;

  @ApiProperty({ format: 'uuid', description: 'Approver the request was addressed to' })
  requestedToUserId!: string;

  @ApiProperty()
  requestedAt!: Date;

  @ApiPropertyOptional({ nullable: true, description: 'Auto-expires once this passes' })
  dueAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  decidedAt!: Date | null;

  @ApiProperty({ type: [ConfirmationDecisionDto] })
  decisions!: ConfirmationDecisionDto[];
}

export class PagedConfirmationsDto {
  @ApiProperty({ type: [ConfirmationResponseDto] })
  items!: ConfirmationResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
