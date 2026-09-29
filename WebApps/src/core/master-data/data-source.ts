import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { LocationType, MasterDataCollection, MasterDataRowTypes } from "./types";

/**
 * The single seam for master-data reads — `queries.ts` and every screen go
 * through here, nothing calls `apiClient` for reference data directly.
 *
 * Real endpoints, verified in source: `Backend/src/modules/master-data`
 * registers `/factories`, `/locations`, `/trolleys`, `/needle-types`,
 * `/exchange-types`, `/employees` and `/suppliers`, each requiring
 * `MASTER_VIEW` to read. Writes live in each feature's own data source, never
 * here.
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
 * `/suppliers` takes `page` and `pageSize` and nothing else: `?status=` is a
 * 400 because a supplier has no lifecycle (`.scratch/receiving-supplier`
 * decision 6), and `?factoryId=` is a 400 because a supplier is business-wide
 * (`SupplierQueryDto`, `Docs/12` §9 "Supplier").
 *
 * The `never`s are the point — they keep the shape assignable everywhere the
 * generic query is widened, while making `fetchMasterData("suppliers", {
 * status: "ACTIVE" })` a compile error instead of a 400 discovered at runtime.
 */
export interface SupplierQuery {
  factoryId?: never;
  status?: never;
  locationType?: never;
}

/**
 * The query for one collection. Only `locations` admits `locationType`; asking
 * for it on any other collection is a compile error rather than a 400 found at
 * runtime. `suppliers` admits no filter at all.
 *
 * The supplier branch is written `[C] extends ["suppliers"]` so it does not
 * distribute: with `C` left as the whole union the answer stays `LocationsQuery`,
 * exactly as before, rather than fanning out into a union of query shapes.
 */
export type MasterDataQuery<C extends MasterDataCollection = MasterDataCollection> = [C] extends [
  "suppliers",
]
  ? SupplierQuery
  : "locations" extends C
    ? LocationsQuery
    : MasterDataQueryBase;

/**
 * Collections whose endpoint accepts no filter at all, enforced at the seam
 * and not only in the type — a caller reaching this through a widened
 * `MasterDataCollection` (a nav-driven screen, `MasterDataName`) has no
 * literal type left to check against, and the backend answers a stray
 * `status` with a 400 rather than ignoring it.
 */
const FILTERLESS_COLLECTIONS = new Set<MasterDataCollection>(["suppliers"]);

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
  const filterless = FILTERLESS_COLLECTIONS.has(collection);

  const params = {
    factoryId: filterless ? undefined : filters.factoryId,
    status: filterless ? undefined : filters.status,
    locationType: filterless ? undefined : filters.locationType,
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
