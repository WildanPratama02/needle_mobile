import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus, LocationType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * Filters shared by every master-data list. Anything else a caller sends is
 * rejected by the global whitelist pipe rather than silently ignored.
 *
 * There is deliberately no `search` parameter. Free-text search needs a defined
 * target column per collection, and inventing one per endpoint is how two
 * collections end up searching different things under the same name.
 */
export class MasterDataQueryDto {
  @ApiPropertyOptional({ enum: EntityStatus, description: 'Omit to include inactive rows.' })
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

/**
 * Adds the factory filter, for the collections that have a factory to filter
 * on: `Factory` itself, `Location`, `Trolley` and `Employee`.
 *
 * `NeedleType` and `ExchangeType` use the base class instead — they carry no
 * `factoryId` column at all. They are business-wide catalogues, so a factory
 * filter would have nothing to match and is refused with a 400 rather than
 * accepted and quietly ignored.
 */
export class ScopedMasterDataQueryDto extends MasterDataQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Narrows to one factory. Intersected with the caller scope, never widening it.',
  })
  @IsOptional()
  @IsUUID()
  factoryId?: string;
}

/**
 * Locations are the one scoped collection whose *type* is a real filter
 * (`.scratch/inventory-location-master-data/issues/02`): a Stock Return wants
 * warehouses, a Storage Mapping wants used-needle bins. Before this, callers
 * fetched the whole collection and filtered it in memory, which is correct
 * only while the collection fits in one page.
 *
 * It lives here rather than on `ScopedMasterDataQueryDto` because trolleys and
 * employees have no location type — the whitelist pipe should keep rejecting
 * it there instead of accepting a filter that matches nothing.
 */
export class ListLocationsQueryDto extends ScopedMasterDataQueryDto {
  @ApiPropertyOptional({ enum: LocationType, description: 'Narrows to one kind of location.' })
  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;
}

/**
 * `StorageMapping` carries no `factoryId` column of its own — its factory is
 * its trolley's. `factoryId` here filters via that join, same intersect-not-
 * widen rule as `ScopedMasterDataQueryDto`.
 */
export class StorageMappingQueryDto extends ScopedMasterDataQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trolleyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  exchangeTypeId?: string;
}

/**
 * Paging only. `MasterDataQueryDto` would bring `status` along, and a supplier
 * has none (`.scratch/receiving-supplier` decision 6) — accepting a filter the
 * collection cannot honour is worse than rejecting it, so this does not extend
 * it. The whitelist pipe turns `?status=…` into a 400, the same way `factoryId`
 * is refused on the business-wide catalogues.
 */
export class SupplierQueryDto {
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
