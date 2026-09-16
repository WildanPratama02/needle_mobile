import { useMutation, useQuery } from "@tanstack/react-query";

import { inventoryKeys } from "./queries";
import {
  fetchAdjustment,
  fetchAdjustments,
  fetchReturn,
  fetchReturns,
  fetchTransfer,
  fetchTransfers,
  uploadAdjustmentEvidence,
} from "./operation-history-data-source";
import type {
  AdjustmentListFilters,
  OperationHistoryFilters,
  Paged,
  RelocationHistoryItem,
  RelocationKind,
} from "./operation-history-types";

/**
 * Every history key lives under `inventoryKeys.all`, so the create mutations
 * in `queries.ts` (which invalidate the whole `inventory` space) refresh the
 * history lists without knowing they exist.
 */
export const operationHistoryKeys = {
  relocations: (kind: RelocationKind, filters: OperationHistoryFilters) =>
    [...inventoryKeys.all, kind === "transfer" ? "transfers" : "returns", filters] as const,
  relocation: (kind: RelocationKind, id: string) =>
    [...inventoryKeys.all, kind === "transfer" ? "transfer" : "return", id] as const,
  adjustments: (filters: AdjustmentListFilters) => [...inventoryKeys.all, "adjustments", filters] as const,
  adjustment: (id: string) => [...inventoryKeys.all, "adjustment", id] as const,
};

/** `enabled` carries the caller's `STOCK_VIEW` answer; a 403 is a boundary, not retried. */
export function useRelocations(kind: RelocationKind, filters: OperationHistoryFilters, enabled = true) {
  return useQuery({
    queryKey: operationHistoryKeys.relocations(kind, filters),
    queryFn: (): Promise<Paged<RelocationHistoryItem>> =>
      kind === "transfer" ? fetchTransfers(filters) : fetchReturns(filters),
    retry: false,
    enabled,
  });
}

export function useRelocation(kind: RelocationKind, id: string | null, enabled = true) {
  return useQuery({
    queryKey: operationHistoryKeys.relocation(kind, id ?? ""),
    queryFn: (): Promise<RelocationHistoryItem> =>
      kind === "transfer" ? fetchTransfer(id as string) : fetchReturn(id as string),
    retry: false,
    enabled: enabled && id !== null,
  });
}

export function useAdjustments(filters: AdjustmentListFilters, enabled = true) {
  return useQuery({
    queryKey: operationHistoryKeys.adjustments(filters),
    queryFn: () => fetchAdjustments(filters),
    retry: false,
    enabled,
  });
}

/** Evidence URLs are presigned for 15 minutes — default `staleTime: 0` means reopening a detail refetches fresh ones. */
export function useAdjustment(id: string | null, enabled = true) {
  return useQuery({
    queryKey: operationHistoryKeys.adjustment(id ?? ""),
    queryFn: () => fetchAdjustment(id as string),
    retry: false,
    enabled: enabled && id !== null,
  });
}

/** Uploading changes no balance and no list — nothing to invalidate. */
export function useUploadAdjustmentEvidence() {
  return useMutation({ mutationFn: uploadAdjustmentEvidence });
}
