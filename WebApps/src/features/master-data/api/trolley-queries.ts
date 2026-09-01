import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import { createTrolley, updateTrolley } from "./trolley-data-source";
import type { UpdateTrolleyInput } from "./trolley-types";

/**
 * Invalidates only the `trolleys` collection's own scoped key
 * (`masterDataKeys.collection("trolleys", {})` — the empty query object
 * partial-matches every cached query-filter variant of this collection via
 * TanStack Query's fuzzy key matching, without touching other collections'
 * caches). The Exchange filter's trolley select and Device registration's
 * trolley select both read `trolleys` through the same `useMasterData`
 * cache, so a new/edited trolley appears there without a page reload
 * (ticket 03 acceptance).
 */
export function useCreateTrolley() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrolley,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("trolleys", {}) });
    },
  });
}

export function useUpdateTrolley() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTrolleyInput }) => updateTrolley(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("trolleys", {}) });
    },
  });
}
