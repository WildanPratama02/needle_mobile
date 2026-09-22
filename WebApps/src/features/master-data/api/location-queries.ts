import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import { createLocation, updateLocation } from "./location-data-source";
import type { UpdateLocationInput } from "./location-types";

/**
 * Invalidates every cached variant of the `locations` collection
 * (`masterDataKeys.collection("locations", {})` partial-matches each
 * `{ factoryId }` / `{}` query object). The Storage Mapping dialog's Storage
 * Location select, the Trolley edit form and the Inventory location pickers
 * all read `locations` through the same `useMasterData` cache, so a new or
 * edited location shows up there without a page reload.
 */
function useInvalidateLocations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("locations", {}) });
}

export function useCreateLocation() {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLocation() {
  const invalidate = useInvalidateLocations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLocationInput }) => updateLocation(id, input),
    onSuccess: () => invalidate(),
  });
}
