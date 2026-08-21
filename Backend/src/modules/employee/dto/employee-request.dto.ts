import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-0001', description: 'Manually assigned by the admin — an HR badge number, not app-generated.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeNumber!: string;

  @ApiProperty({ example: 'Siti Operator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Sewing Line 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;

  @ApiPropertyOptional({
    example: 'RFID001',
    description:
      'Optional inline enroll — tap the reader while filling the form to give the new ' +
      'employee their first RFID card in the same submit. Leave blank to enroll later.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  rfidUid?: string;
}

/**
 * `employeeNumber`/`factoryId` are deliberately absent — badge renumbering
 * and factory transfer are out of scope
 * (`.scratch/master-data-storage-rfid/spec.md`, "explicitly out of scope").
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Siti Operator' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Sewing Line 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
