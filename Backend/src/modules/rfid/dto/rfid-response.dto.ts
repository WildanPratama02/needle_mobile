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

class RfidLookupEmployeeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'EMP001' })
  employeeNumber!: string;

  @ApiProperty({ example: 'Operator Name' })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ enum: EntityStatus })
  status!: EntityStatus;
}

class RfidLookupCardDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'RFID001' })
  uid!: string;

  @ApiProperty({ enum: EntityStatus })
  status!: EntityStatus;
}

/** `GET /rfid/cards/uid/{rfidUid}` — the Docs/13 §8 shape. */
export class RfidLookupResponseDto {
  @ApiProperty({ type: RfidLookupEmployeeDto })
  employee!: RfidLookupEmployeeDto;

  @ApiProperty({ type: RfidLookupCardDto })
  rfidCard!: RfidLookupCardDto;
}
