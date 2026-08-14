import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus, LocationType } from '@prisma/client';

/**
 * Every master-data row answers the same four questions: which row, what is it
 * called short, what is it called long, and is it still in use. Sharing that
 * shape is what lets the WebApps lookup layer resolve any id to a label through
 * one code path instead of six.
 *
 * Timestamps and relation arrays are deliberately absent — no screen reads them
 * and every extra field is one more thing a client can come to depend on.
 */
export class MasterDataRowDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TRL-A-01', description: 'Short human-facing identifier.' })
  code!: string;

  @ApiProperty({ example: 'Trolley A-01' })
  name!: string;

  @ApiProperty({ enum: EntityStatus })
  status!: EntityStatus;
}

export class FactoryResponseDto extends MasterDataRowDto {
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'Asia/Jakarta' })
  timezone!: string;
}

export class LocationResponseDto extends MasterDataRowDto {
  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ enum: LocationType })
  locationType!: LocationType;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentLocationId!: string | null;
}

export class TrolleyResponseDto extends MasterDataRowDto {
  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'A trolley is an inventory location (ADR-003); this is where its stock lives.',
  })
  locationId!: string;
}

export class NeedleTypeResponseDto extends MasterDataRowDto {
  @ApiPropertyOptional({ nullable: true, example: 'Sewing' })
  category!: string | null;

  @ApiProperty({ example: 'PCS' })
  unit!: string;

  @ApiProperty({
    example: 50,
    description: 'Stored as a decimal; sent as a number so clients need no decimal library.',
  })
  minimumStock!: number;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
}

export class ExchangeTypeResponseDto extends MasterDataRowDto {
  @ApiProperty({
    description: 'True for BROKEN — the only type that reaches the FRAGMENT_CHECK state.',
  })
  requiresFragmentValidation!: boolean;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
}

export class EmployeeResponseDto extends MasterDataRowDto {
  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({
    example: 'EMP-0001',
    description: 'Same value as `code`, named as the domain names it.',
  })
  employeeNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  department!: string | null;
}
