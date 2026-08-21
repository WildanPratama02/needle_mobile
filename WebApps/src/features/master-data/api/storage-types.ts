/**
 * Mirrors the real, code-verified contract in
 * `Backend/src/modules/master-data/{controllers,dto,services}` —
 * `StorageMappingController`/`StorageMappingResponseDto`. `StorageMapping`
 * has no `code`/`name` columns, so it does not fit `core/master-data`'s
 * `MasterDataRow` shape — this trio stays outside that module
 * (`.scratch/master-data-storage-rfid/issues/05-webapps-storage-screen.md`).
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/** `StorageMappingResponseDto`. */
export interface StorageMapping {
  id: string;
  trolleyId: string;
  exchangeTypeId: string;
  storageLocationId: string;
  status: EntityStatus;
}

/** Only the params `StorageMappingQueryDto` actually declares. */
export interface StorageMappingListFilters {
  /** "all" = omit — intersected with the caller's scope server-side either way. */
  factoryId: string;
  /** "" = omit. */
  trolleyId: string;
  /** "" = omit. */
  exchangeTypeId: string;
  page: number;
  pageSize: number;
}

export interface PagedStorageMappings {
  items: StorageMapping[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** `CreateStorageMappingDto`. */
export interface CreateStorageMappingInput {
  trolleyId: string;
  exchangeTypeId: string;
  storageLocationId: string;
}

/**
 * `UpdateStorageMappingDto` — `storageLocationId` only. `trolleyId`/
 * `exchangeTypeId` are the row's identity and are not editable
 * (spec decision #2).
 */
export interface UpdateStorageMappingInput {
  storageLocationId: string;
}
