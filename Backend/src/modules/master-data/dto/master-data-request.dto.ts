import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * `master-data`'s first write DTOs — `StorageMapping` only. Employee's own
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
