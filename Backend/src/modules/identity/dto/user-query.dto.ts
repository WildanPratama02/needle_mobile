import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * Mirrors `ScopedMasterDataQueryDto` (`modules/master-data/dto/master-data-query.dto.ts`):
 * pagination plus an optional `factoryId` that narrows the caller's own scope
 * rather than replacing it. No `search` — same reasoning as master data, a
 * free-text target needs a defined column and none is decided yet.
 */
export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: UserStatus, description: 'Omit to include inactive users.' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Narrows to one factory. Intersected with the caller scope, never widening it.',
  })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

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
