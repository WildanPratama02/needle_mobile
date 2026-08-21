import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';

export class RfidCardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'RFID001' })
  rfidUid!: string;

  @ApiProperty({ format: 'uuid' })
  employeeId!: string;

  @ApiProperty({ enum: EntityStatus })
  status!: EntityStatus;

  @ApiProperty()
  issuedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  revokedAt!: Date | null;
}
