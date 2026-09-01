import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import {
  activateNeedleType,
  createNeedleType,
  deactivateNeedleType,
  updateNeedleType,
} from "./needle-type-data-source";
import type { UpdateNeedleTypeInput } from "./needle-type-types";

/**
 * Invalidates only the `needle-types` collection's own scoped key
 * (`masterDataKeys.collection("needle-types", {})` — the empty query object
 * partial-matches every cached query-filter variant of this collection via
 * TanStack Query's fuzzy key matching, without touching other collections'
 * caches). A needle type is read by receiving/transfer/adjustment selectors
 * and the count-session flow (ticket 05), all of which key off this same
 * collection.
 */
export function useCreateNeedleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNeedleType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("needle-types", {}) });
    },
  });
}

export function useUpdateNeedleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNeedleTypeInput }) => updateNeedleType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("needle-types", {}) });
    },
  });
}

export function useActivateNeedleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateNeedleType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("needle-types", {}) });
    },
  });
}

export function useDeactivateNeedleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateNeedleType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("needle-types", {}) });
    },
  });
}
