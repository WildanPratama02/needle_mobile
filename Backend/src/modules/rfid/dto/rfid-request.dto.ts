import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * No revoke DTO — revoke takes only the `:id` path param, no body
 * (`.scratch/master-data-storage-rfid/issues/04-backend-rfid-enroll-revoke.md`).
 */
export class EnrollRfidCardDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  employeeId!: string;

  @ApiProperty({
    example: 'RFID001',
    description: 'Captured by an HID keyboard-wedge USB reader — a plain typed string.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  rfidUid!: string;
}
