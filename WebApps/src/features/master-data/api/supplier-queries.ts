import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import { createSupplier, updateSupplier } from "./supplier-data-source";
import type { UpdateSupplierInput } from "./supplier-types";

/**
 * Invalidates only the `suppliers` collection's own scoped key
 * (`masterDataKeys.collection("suppliers", {})` — the empty query object
 * partial-matches every cached variant of this collection via TanStack
 * Query's fuzzy key matching, without touching other collections' caches).
 * `{}` is in fact the only variant suppliers ever has: the endpoint accepts
 * `page`/`pageSize` and no filter.
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("suppliers", {}) });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      updateSupplier(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.collection("suppliers", {}) });
    },
  });
}
