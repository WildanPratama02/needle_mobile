import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAdjustment,
  createReceiving,
  createTransfer,
  fetchBalances,
  fetchMovements,
  fetchTrolleyStock,
} from "./data-source";
import type { BalanceListFilters, MovementListFilters } from "./types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  balances: (filters: BalanceListFilters) => [...inventoryKeys.all, "balances", filters] as const,
  currentBalance: (locationId: string, needleTypeId: string) =>
    [...inventoryKeys.all, "current-balance", locationId, needleTypeId] as const,
  trolleyStock: (trolleyId: string) => [...inventoryKeys.all, "trolley-stock", trolleyId] as const,
  movements: (filters: MovementListFilters) => [...inventoryKeys.all, "movements", filters] as const,
};

/** `enabled` carries the caller's `STOCK_VIEW` answer — same convention as `useExchangeList`/`useAuditLogs`: a 403 is an authorization boundary, not retried. */
export function useBalances(filters: BalanceListFilters, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.balances(filters),
    queryFn: () => fetchBalances(filters),
    retry: false,
    enabled,
  });
}

/**
 * The system quantity for one (location, needle type) pair — the "Current
 * Balance" a Receiving/Adjustment ConfirmDialog shows before submit (Docs/18
 * §22/§24). Reuses `GET /inventory/balances` rather than inventing a new
 * endpoint; 0 stands in for "no balance row yet" the same way the backend's
 * own `receiveStock`/`adjustStock` treat a missing row.
 */
export function useCurrentBalance(locationId: string, needleTypeId: string, enabled = true) {
  const filters: BalanceListFilters = {
    factoryId: "all",
    locationId,
    trolleyId: "",
    needleTypeId,
    lowStock: false,
    page: 1,
    pageSize: 1,
  };

  return useQuery({
    queryKey: inventoryKeys.currentBalance(locationId, needleTypeId),
    queryFn: async () => {
      const paged = await fetchBalances(filters);
      return paged.items[0]?.quantity ?? 0;
    },
    enabled: enabled && locationId !== "" && needleTypeId !== "",
  });
}

/** Only called for a chosen trolley — Stock Overview's drill-down dialog. */
export function useTrolleyStock(trolleyId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.trolleyStock(trolleyId ?? ""),
    queryFn: () => fetchTrolleyStock(trolleyId as string),
    enabled: trolleyId !== null,
  });
}

export function useMovements(filters: MovementListFilters, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.movements(filters),
    queryFn: () => fetchMovements(filters),
    retry: false,
    enabled,
  });
}

/**
 * Every mutation invalidates the whole `inventory` key space on success:
 * Receiving/Transfer/Adjustment each change balances that Stock Overview,
 * Stock Movement, and (for Adjustment) the very "Current Balance" preview
 * above are all reading — the ledger is one shared resource, not three
 * independent ones.
 */
export function useCreateReceiving() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReceiving,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
