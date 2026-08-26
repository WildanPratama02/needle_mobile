import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import { ROLES } from '../../../shared/constants/roles';

/**
 * `.scratch/users-read-api/spec.md` (GAP-06), extended by
 * `.scratch/roles-permissions/spec.md` with the `role=<code>` filter — the
 * one new query param that spec adds, so Roles & Permissions' member lookup
 * reuses this endpoint instead of duplicating pagination/scope. No
 * free-text search (same reasoning as `MasterDataQueryDto` — a search
 * target needs a defined column, and no spec has asked for one).
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

  @ApiPropertyOptional({
    enum: Object.values(ROLES),
    description: 'Narrows to users holding this role.',
  })
  @IsOptional()
  @IsIn(Object.values(ROLES))
  role?: string;
}
