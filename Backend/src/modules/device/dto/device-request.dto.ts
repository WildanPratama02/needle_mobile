import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Trims before validation, same helper `confirmation-request.dto.ts` establishes for a free-text reason. */
const trimmed = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/**
 * `.scratch/device-and-inventory/spec.md` Device story 6/7. `trolleyId` must
 * belong to `factoryId` — the service rejects otherwise with 400, the same
 * consistency check the exchange flow already makes between a trolley and
 * its factory.
 */
export class RegisterDeviceDto {
  @ApiProperty({ example: 'DEV-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceCode!: string;

  @ApiProperty({ example: 'Trolley A-01 Tablet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  deviceName!: string;

  @ApiProperty({ example: 'SN-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  serialNumber!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  trolleyId!: string;
}

/**
 * Device story 10/11 — the exact same trolley-belongs-to-factory validation
 * as registration, applied to an in-place binding update instead of a create.
 */
export class ReassignDeviceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  trolleyId!: string;
}

/**
 * Body for activate/revoke — Device story 30's confirmation-step dialog
 * sends an optional free-text note, never required (unlike Confirmation's
 * Reject, nothing in this spec makes a device reason mandatory).
 */
export class DeviceActionDto {
  @ApiPropertyOptional({ example: 'Lost in shipping; replacement issued.' })
  @IsOptional()
  @IsString()
  @trimmed()
  @MaxLength(500)
  reason?: string;
}
