import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import { createLocation, updateLocation } from "./location-data-source";
import type { UpdateLocationInput } from "./location-types";

/**
 * Invalidates only the `locations` collection's own scoped key
 * (`masterDataKeys.collection("locations", {})` — the empty query object
 * partial-matches every cached query-filter variant of this collection via
 * TanStack Query's fuzzy key matching, without touching other collections'
 * caches).
 *
 * Every location picker in the product reads `locations` through that same
 * `useMasterData` cache — Receiving's destination, Transfer's and Stock
 * Return's source/destination, Adjustment's and Physical Count's location, the
 * Storage Mapping form's storage location, and Trolley's own location field —
 * so a warehouse or used-needle bin created here shows up in all of them
 * without a page reload (ticket 01 acceptance).
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("locations", {}) });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLocationInput }) => updateLocation(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("locations", {}) });
    },
  });
}
