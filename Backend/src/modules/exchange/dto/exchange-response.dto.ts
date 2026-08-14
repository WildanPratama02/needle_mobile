import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeState, FragmentStatus } from '@prisma/client';

export class ExchangeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'EXC-20260810-000001' })
  exchangeNumber!: string;

  /**
   * Named `status` on the wire to match Docs/12, while the domain term is
   * Exchange State (CONTEXT.md).
   */
  @ApiProperty({ enum: ExchangeState })
  status!: ExchangeState;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  trolleyId!: string;

  @ApiProperty({ format: 'uuid' })
  deviceId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  operatorId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  exchangeTypeId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  oldNeedleTypeId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  newNeedleTypeId!: string | null;

  @ApiPropertyOptional({ enum: FragmentStatus, nullable: true })
  fragmentStatus!: FragmentStatus | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Set when a Confirmation was raised',
  })
  confirmationId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt!: Date | null;
}

export class PagedExchangesDto {
  @ApiProperty({ type: [ExchangeResponseDto] })
  items!: ExchangeResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
