import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus, LocationType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * `master-data`'s write DTOs. Employee's own
 * writes live in the `employee` module (`.scratch/master-data-storage-rfid`
 * decision #15), so this module's writes stay scoped to what it still owns.
 */
export class CreateStorageMappingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  trolleyId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  exchangeTypeId!: string;

  @ApiProperty({ format: 'uuid', description: 'Must be a Location of type USED_NEEDLE_STORAGE.' })
  @IsUUID()
  storageLocationId!: string;
}

/**
 * `trolleyId`/`exchangeTypeId` are deliberately absent — they form the row's
 * identity (`@@unique([trolleyId, exchangeTypeId])`). Changing either is a
 * delete + recreate, not an edit (spec decision #2).
 */
export class UpdateStorageMappingDto {
  @ApiProperty({ format: 'uuid', description: 'Must be a Location of type USED_NEEDLE_STORAGE.' })
  @IsUUID()
  storageLocationId!: string;
}

// ---------------------------------------------------------------------------
// Needle Type / Factory / Trolley writes (`.scratch/admin-panel-crud/issues/01`–`03`)
//
// Every create DTO carries the row's identity (`code`, and `factoryId` for a
// trolley); every update DTO leaves it out. Identity is set once — the same
// rule `UpdateEmployeeDto` and `UpdateStorageMappingDto` already follow.
// ---------------------------------------------------------------------------

export class CreateNeedleTypeDto {
  @ApiProperty({ example: 'DBX1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Needle Type Example' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Sewing' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 'PCS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  minimumStock!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateNeedleTypeDto {
  @ApiPropertyOptional({ example: 'Needle Type Example' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Sewing' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFactoryDto {
  @ApiProperty({ example: 'FACTORY-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Factory 01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'Asia/Jakarta', description: 'IANA time zone.' })
  @IsTimeZone()
  @MaxLength(100)
  timezone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFactoryDto {
  @ApiPropertyOptional({ example: 'Factory 01' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Asia/Jakarta', description: 'IANA time zone.' })
  @IsOptional()
  @IsTimeZone()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTrolleyDto {
  @ApiProperty({ format: 'uuid', description: 'Must be an ACTIVE factory in the caller scope.' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ example: 'TR-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Trolley 01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;
}

export class UpdateTrolleyDto {
  @ApiPropertyOptional({ example: 'Trolley 01' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Must be a TROLLEY location in the same factory, not owned by another trolley.',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

/**
 * `Docs/12` §9 (`.scratch/inventory-location-master-data/issues/01`).
 *
 * `locationType` is set here and never again: every stock movement points at
 * the row, so changing what it is would rewrite the meaning of history. A
 * `TROLLEY` location is created by `POST /trolleys` instead (ADR-003) and is
 * refused by the service.
 */
export class CreateLocationDto {
  @ApiProperty({ format: 'uuid', description: 'Must be an ACTIVE factory in the caller scope.' })
  @IsUUID()
  factoryId!: string;

  @ApiProperty({ example: 'WH-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Needle Warehouse' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    enum: LocationType,
    description: 'WAREHOUSE or USED_NEEDLE_STORAGE. TROLLEY is refused — use POST /trolleys.',
  })
  @IsEnum(LocationType)
  locationType!: LocationType;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Must be a WAREHOUSE location in the same factory. Lets a bay sit under its warehouse.',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string | null;
}

/** `code` and `locationType` are absent on purpose — both are immutable. */
export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Needle Warehouse' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Must be a WAREHOUSE location in the same factory, and cannot be the location itself; null detaches it.',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string | null;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

/**
 * Who stock is received from (`.scratch/receiving-supplier/issues/01`).
 *
 * No `status` field here or on the update: a supplier is never deactivated
 * (spec decision 6), so there is no lifecycle to drive.
 */
export class CreateSupplierDto {
  @ApiProperty({ example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'PT Jarum Makmur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'sales@jarummakmur.co.id',
    description: 'One line — a phone number or an email.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

/** `code` is absent on purpose — immutable after create, like Factory and NeedleType. */
export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'PT Jarum Makmur' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'sales@jarummakmur.co.id' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
