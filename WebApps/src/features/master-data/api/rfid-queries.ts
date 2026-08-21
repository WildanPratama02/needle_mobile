import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { enrollRfidCard, fetchRfidCards, revokeRfidCard } from "./rfid-data-source";
import type { RfidCardListFilters } from "./rfid-types";

export const rfidCardKeys = {
  all: ["rfid-cards"] as const,
  list: (filters: RfidCardListFilters) => [...rfidCardKeys.all, "list", filters] as const,
};

export function useRfidCards(filters: RfidCardListFilters, enabled = true) {
  return useQuery({
    queryKey: rfidCardKeys.list(filters),
    queryFn: () => fetchRfidCards(filters),
    retry: false,
    enabled,
  });
}

/**
 * Enrolling auto-revokes the employee's previous active card in the same
 * backend transaction (spec decision #8) — one list invalidation covers both
 * the new row and the flipped-to-revoked old one, so the list reflects both
 * without a manual refresh.
 */
export function useEnrollRfidCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enrollRfidCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfidCardKeys.all });
    },
  });
}

export function useRevokeRfidCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeRfidCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfidCardKeys.all });
    },
  });
}
