import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/core/auth/queries";
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
 *
 * Create also invalidates `/auth/me`: the backend grants the creator scope to
 * the new factory, and `useAuthorizedFactories` (TopBar switcher,
 * `FactorySelect`) takes the scope list from `/auth/me` `factoryIds`, never
 * from the catalogue. Refreshing only `factories` would leave the new
 * factory out of the switcher until the next session refresh.
 */
export function useCreateFactory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFactory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("factories", {}) });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
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
