import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * One audit record, carrying the columns `Docs/10` §17 defines and nothing
 * beyond them.
 */
export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty({ example: 'ISSUE_NEEDLE' })
  action!: string;

  @ApiProperty({ example: 'Exchange' })
  entityType!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Null for actions taken by a scheduled job, or once the account is deleted.',
  })
  actorUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  actorDeviceId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  factoryId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Correlates with the response meta.' })
  requestId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Always null — see ARCHITECTURE.md.' })
  beforeData!: unknown;

  @ApiPropertyOptional({ nullable: true })
  afterData!: unknown;

  @ApiPropertyOptional({ nullable: true })
  metadata!: unknown;
}
