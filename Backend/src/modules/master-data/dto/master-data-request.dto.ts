import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus, LocationType } from '@prisma/client';
import {
  IsEnum,
  IsIn,
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

// ---------------------------------------------------------------------------
// Location writes (`.scratch/admin-panel-crud/issues/09`)
//
// `TROLLEY` is deliberately not creatable here: a trolley location is born
// with its trolley through `POST /trolleys` (ADR-003), so a bare one would be
// a location no trolley owns.
// ---------------------------------------------------------------------------

export const CREATABLE_LOCATION_TYPES = [
  LocationType.WAREHOUSE,
  LocationType.USED_NEEDLE_STORAGE,
] as const;
export type CreatableLocationType = (typeof CREATABLE_LOCATION_TYPES)[number];

export class CreateLocationDto {
  @ApiProperty({ format: 'uuid', description: 'Must be an ACTIVE factory in the caller scope.' })
  @IsUUID()
  factoryId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Must be a WAREHOUSE location in the same factory.',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string | null;

  @ApiProperty({ example: 'UNS-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Used Needle Storage' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    enum: CREATABLE_LOCATION_TYPES,
    description: 'TROLLEY locations are created with their trolley via POST /trolleys.',
  })
  @IsIn(CREATABLE_LOCATION_TYPES)
  locationType!: CreatableLocationType;
}

/** `code`, `factoryId` and `locationType` are the row's identity — set once. */
export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Used Needle Storage' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Must be a WAREHOUSE location in the same factory; null detaches it.',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string | null;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
