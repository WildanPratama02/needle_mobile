import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type {
  CreateStorageMappingInput,
  PagedStorageMappings,
  StorageMapping,
  StorageMappingListFilters,
  UpdateStorageMappingInput,
} from "./storage-types";

/**
 * The single seam for every `/storage-mappings` call — `storage-queries.ts`
 * and the Storage screen go through here, nothing calls `apiClient` directly.
 * Verified against `Backend/src/modules/master-data/controllers/
 * master-data.controller.ts`'s `StorageMappingController`.
 */

export async function fetchStorageMappings(
  filters: StorageMappingListFilters,
): Promise<PagedStorageMappings> {
  const { data } = await apiClient.get<ApiSuccessBody<StorageMapping[]>>("/storage-mappings", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      trolleyId: filters.trolleyId === "" ? undefined : filters.trolleyId,
      exchangeTypeId: filters.exchangeTypeId === "" ? undefined : filters.exchangeTypeId,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });

  return {
    items: data.data,
    page: data.meta.page ?? filters.page,
    pageSize: data.meta.pageSize ?? filters.pageSize,
    total: data.meta.total ?? 0,
    totalPages: data.meta.totalPages ?? 0,
  };
}

/** `POST /storage-mappings` — `MASTER_EDIT`. 400 on a bad location, 409 on a duplicate (trolley, exchange type) pair. */
export async function createStorageMapping(
  input: CreateStorageMappingInput,
): Promise<StorageMapping> {
  const { data } = await apiClient.post<ApiSuccessBody<StorageMapping>>("/storage-mappings", input);
  return data.data;
}

/** `PATCH /storage-mappings/:id` — `MASTER_EDIT`. Destination only; `trolleyId`/`exchangeTypeId` are not accepted. */
export async function updateStorageMapping(
  id: string,
  input: UpdateStorageMappingInput,
): Promise<StorageMapping> {
  const { data } = await apiClient.patch<ApiSuccessBody<StorageMapping>>(
    `/storage-mappings/${id}`,
    input,
  );
  return data.data;
}
