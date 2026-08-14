import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchMasterData, type MasterDataQuery } from "./data-source";
import type { MasterDataCollection, MasterDataRow, MasterDataRowTypes } from "./types";

/**
 * Reference data changes rarely and is read constantly. Half an hour of
 * freshness means navigating between screens resolves names out of cache
 * instead of re-fetching a catalogue that has not moved.
 */
const REFERENCE_DATA_STALE_MS = 30 * 60 * 1000;

export const masterDataKeys = {
  all: ["master-data"] as const,
  collection: (collection: MasterDataCollection, query: MasterDataQuery) =>
    [...masterDataKeys.all, collection, query] as const,
};

/**
 * One collection, cached. This is the only hook that fetches reference data;
 * every resolver below reads from it.
 */
export function useMasterData<C extends MasterDataCollection>(
  collection: C,
  query: MasterDataQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: masterDataKeys.collection(collection, query),
    queryFn: () => fetchMasterData(collection, query),
    staleTime: REFERENCE_DATA_STALE_MS,
    // `MASTER_VIEW` is a permission a user either holds or does not — a 403 is
    // an authorization boundary, not a transient failure worth retrying.
    retry: false,
    enabled,
  });
}

export interface Lookup<T extends MasterDataRow> {
  /** The row behind an id, or `undefined` when it is not in this collection. */
  get: (id: string | null | undefined) => T | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Turns a collection into an id-to-row resolver.
 *
 * The map is built once per fetched collection rather than per lookup, so a
 * long table costs one pass over the catalogue instead of one scan per row.
 */
export function useLookup<C extends MasterDataCollection>(
  collection: C,
  query: MasterDataQuery = {},
  enabled = true,
): Lookup<MasterDataRowTypes[C]> {
  const { data, isLoading, isError } = useMasterData(collection, query, enabled);

  const byId = React.useMemo(() => {
    const map = new Map<string, MasterDataRowTypes[C]>();
    for (const row of data ?? []) {
      map.set(row.id, row);
    }
    return map;
  }, [data]);

  return React.useMemo(
    () => ({
      get: (id) => (id ? byId.get(id) : undefined),
      isLoading,
      isError,
    }),
    [byId, isLoading, isError],
  );
}

/**
 * The one place an id becomes something a person reads.
 *
 * **An unresolved row falls back to the `fallback` the caller passes — always
 * the id itself.** Never a blank, never a dash, and never a label derived from
 * the id. A reader has to be able to tell "this reference did not resolve"
 * from "this field is empty", and must never be shown a name the client
 * invented. Every rendering path goes through here so that rule has a single
 * home rather than one copy per call site.
 */
export function displayLabel(
  row: MasterDataRow | undefined,
  fallback: string,
  withCode = true,
): string {
  if (!row) return fallback;
  if (withCode && row.name && row.name !== row.code) {
    return `${row.code} — ${row.name}`;
  }
  return row.name || row.code;
}
