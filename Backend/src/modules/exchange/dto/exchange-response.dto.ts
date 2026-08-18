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

  /**
   * The exchange type's own labels, projected from a relation every read
   * already loads for the state machine — so they cost no extra query.
   *
   * Null until a type is selected, never a placeholder: an exchange is opened
   * before its type is chosen, and "not chosen yet" has to stay tellable apart
   * from a real value.
   */
  @ApiPropertyOptional({ example: 'BROKEN', nullable: true })
  exchangeTypeCode!: string | null;

  @ApiPropertyOptional({ example: 'Broken Needle', nullable: true })
  exchangeTypeName!: string | null;

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
