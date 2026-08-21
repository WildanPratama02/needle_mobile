import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MasterDataRowDto } from '../../master-data/dto/master-data-response.dto';

/**
 * Moved here from `master-data` (`.scratch/master-data-storage-rfid/spec.md`
 * decision #15) — same shape as before, `MasterDataRowDto`'s id/code/name/
 * status plus these two, so WebApps' shared `MasterDataRow` lookup layer
 * keeps working unchanged.
 */
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
