import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RfidCardQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: EntityStatus, description: 'Omit to include revoked cards.' })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Capped at 100.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
