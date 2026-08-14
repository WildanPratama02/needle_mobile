import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { MasterDataCollection, MasterDataRowTypes } from "./types";

/**
 * The single seam for master-data reads — `queries.ts` and every screen go
 * through here, nothing calls `apiClient` for reference data directly.
 *
 * Real endpoints, verified in source: `Backend/src/modules/master-data`
 * registers `/factories`, `/locations`, `/trolleys`, `/needle-types`,
 * `/exchange-types` and `/employees`, each `GET` only and each requiring
 * `MASTER_VIEW`.
 */

/** The backend caps `pageSize` at 100, so asking for more just wastes the round trip. */
const MAX_PAGE_SIZE = 100;

/**
 * Guards against an unbounded fetch if a catalogue ever grows past what a
 * lookup should be loading eagerly. Hitting it means the collection has
 * outgrown "load it all and resolve in memory" and needs a real search
 * endpoint rather than a bigger number here.
 */
const MAX_PAGES = 20;

export interface MasterDataQuery {
  /** Only meaningful for the four factory-scoped collections. */
  factoryId?: string;
  status?: "ACTIVE" | "INACTIVE";
}

/**
 * Fetches an entire collection.
 *
 * **Per collection, never per id.** A table of fifty exchange rows resolves
 * fifty trolley names out of one cached response — issuing a request per row
 * would turn one screen into fifty round trips.
 */
export async function fetchMasterData<C extends MasterDataCollection>(
  collection: C,
  query: MasterDataQuery = {},
): Promise<MasterDataRowTypes[C][]> {
  type Row = MasterDataRowTypes[C];

  const params = {
    factoryId: query.factoryId,
    status: query.status,
    pageSize: MAX_PAGE_SIZE,
    page: 1,
  };

  const { data } = await apiClient.get<ApiSuccessBody<Row[]>>(`/${collection}`, { params });
  const totalPages = data.meta.totalPages ?? 1;

  if (totalPages <= 1) {
    return data.data;
  }

  // Remaining pages in parallel rather than in sequence — they are independent
  // reads and the collection is already known to be small enough to hold.
  const rest = await Promise.all(
    Array.from({ length: Math.min(totalPages, MAX_PAGES) - 1 }, (_, i) =>
      apiClient
        .get<ApiSuccessBody<Row[]>>(`/${collection}`, { params: { ...params, page: i + 2 } })
        .then((response) => response.data.data),
    ),
  );

  return [data.data, ...rest].flat();
}

/** `GET /{collection}/{id}` — used by detail screens, never by a list resolving names. */
export async function fetchMasterDataRow<C extends MasterDataCollection>(
  collection: C,
  id: string,
): Promise<MasterDataRowTypes[C]> {
  const { data } = await apiClient.get<ApiSuccessBody<MasterDataRowTypes[C]>>(
    `/${collection}/${id}`,
  );
  return data.data;
}
