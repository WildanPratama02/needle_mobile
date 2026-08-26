import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * `.scratch/users-read-api/spec.md` (GAP-06). Deliberately narrow: no
 * `role=<code>` filter (that's `.scratch/roles-permissions/spec.md`'s
 * follow-up) and no free-text search (same reasoning as
 * `MasterDataQueryDto` — a search target needs a defined column, and this
 * spec did not ask for one).
 */
export class UserQueryDto {
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

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Narrows to one factory. Intersected with the caller scope, never widening it.',
  })
  @IsOptional()
  @IsUUID()
  factoryId?: string;
}
