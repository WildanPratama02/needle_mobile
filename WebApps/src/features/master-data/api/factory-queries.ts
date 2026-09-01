import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import { activateFactory, createFactory, deactivateFactory, updateFactory } from "./factory-data-source";
import type { UpdateFactoryInput } from "./factory-types";

/**
 * Invalidates only the `factories` collection's own scoped key
 * (`masterDataKeys.collection("factories", {})` — the empty query object
 * partial-matches every cached query-filter variant of this collection via
 * TanStack Query's fuzzy key matching, without touching other collections'
 * caches). The TopBar factory switcher and
 * `core/permissions/factory-scope.ts` both read `factories` through the same
 * `useMasterData`/`useAuthorizedFactories` cache, so a factory write must
 * still invalidate every cached `factories` query for a newly created or
 * renamed factory to appear without a full reload (ticket 02 acceptance).
 */
export function useCreateFactory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFactory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("factories", {}) });
    },
  });
}

export function useUpdateFactory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFactoryInput }) => updateFactory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("factories", {}) });
    },
  });
}

export function useActivateFactory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateFactory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("factories", {}) });
    },
  });
}

export function useDeactivateFactory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateFactory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("factories", {}) });
    },
  });
}
