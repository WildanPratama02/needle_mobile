import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { LocationType, MasterDataCollection, MasterDataRowTypes } from "./types";

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

/** The filters every collection accepts. */
export interface MasterDataQueryBase {
  /** Only meaningful for the four factory-scoped collections. */
  factoryId?: string;
  status?: "ACTIVE" | "INACTIVE";
}

/**
 * `/locations` alone also filters by type
 * (`ListLocationsQueryDto`, `Docs/12` §9) — intersected with the caller's
 * factory scope like `factoryId`, so it can only narrow. `/trolleys` and
 * `/employees` have no location type and the backend's whitelist pipe rejects
 * the parameter there with a 400, which is why it is not on the base shape.
 */
export interface LocationsQuery extends MasterDataQueryBase {
  locationType?: LocationType;
}

/**
 * The query for one collection. Only `locations` admits `locationType`; asking
 * for it on any other collection is a compile error rather than a 400 found at
 * runtime.
 */
export type MasterDataQuery<C extends MasterDataCollection = MasterDataCollection> =
  "locations" extends C ? LocationsQuery : MasterDataQueryBase;

/**
 * Fetches an entire collection.
 *
 * **Per collection, never per id.** A table of fifty exchange rows resolves
 * fifty trolley names out of one cached response — issuing a request per row
 * would turn one screen into fifty round trips.
 */
export async function fetchMasterData<C extends MasterDataCollection>(
  collection: C,
  query: MasterDataQuery<C> = {},
): Promise<MasterDataRowTypes[C][]> {
  type Row = MasterDataRowTypes[C];

  // Widened once here: `locationType` is `undefined` for every collection but
  // `locations` (the type above is what keeps it that way), and axios omits an
  // undefined param, so nothing is ever sent to an endpoint that rejects it.
  const filters: LocationsQuery = query;

  const params = {
    factoryId: filters.factoryId,
    status: filters.status,
    locationType: filters.locationType,
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
