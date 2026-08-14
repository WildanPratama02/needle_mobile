import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { exchangeKeys } from "@/features/transactions/api/queries";
import type { ConfirmationListFilters } from "./types";
import { approveConfirmation, fetchConfirmation, fetchConfirmations, rejectConfirmation } from "./data-source";

export const confirmationKeys = {
  all: ["confirmations"] as const,
  list: (filters: ConfirmationListFilters) => [...confirmationKeys.all, "list", filters] as const,
  detail: (id: string) => [...confirmationKeys.all, "detail", id] as const,
};

/** `enabled` carries the caller's `CONFIRMATION_VIEW` answer — see `useExchangeList`. */
export function useConfirmationList(filters: ConfirmationListFilters, enabled = true) {
  return useQuery({
    queryKey: confirmationKeys.list(filters),
    queryFn: () => fetchConfirmations(filters),
    retry: false,
    enabled,
  });
}

/** Only called once the exchange has a `confirmationId`. */
export function useConfirmation(confirmationId: string | null) {
  return useQuery({
    queryKey: confirmationKeys.detail(confirmationId ?? ""),
    queryFn: () => fetchConfirmation(confirmationId as string),
    enabled: confirmationId !== null,
  });
}

export function useApproveConfirmation(exchangeId: string, confirmationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => approveConfirmation(confirmationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: confirmationKeys.detail(confirmationId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.all });
      queryClient.invalidateQueries({ queryKey: exchangeKeys.detail(exchangeId) });
    },
  });
}

export function useRejectConfirmation(exchangeId: string, confirmationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => rejectConfirmation(confirmationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: confirmationKeys.detail(confirmationId) });
      queryClient.invalidateQueries({ queryKey: confirmationKeys.all });
      queryClient.invalidateQueries({ queryKey: exchangeKeys.detail(exchangeId) });
    },
  });
}
