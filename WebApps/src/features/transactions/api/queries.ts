import { useQuery } from "@tanstack/react-query";

import type { ExchangeListFilters } from "./types";
import { fetchExchangeDetail, fetchExchangeEvidence, fetchExchanges } from "./data-source";

export const exchangeKeys = {
  all: ["exchanges"] as const,
  list: (filters: ExchangeListFilters) => [...exchangeKeys.all, "list", filters] as const,
  detail: (id: string) => [...exchangeKeys.all, "detail", id] as const,
  evidence: (id: string) => [...exchangeKeys.all, "evidence", id] as const,
};

/**
 * `enabled` carries the caller's `EXCHANGE_VIEW` answer, so a screen that
 * already knows it will be refused never sends the request. A 403 is an
 * authorization boundary rather than a transient failure, so it is not retried
 * — same rule the audit list follows.
 */
export function useExchangeList(filters: ExchangeListFilters, enabled = true) {
  return useQuery({
    queryKey: exchangeKeys.list(filters),
    queryFn: () => fetchExchanges(filters),
    retry: false,
    enabled,
  });
}

export function useExchangeDetail(id: string) {
  return useQuery({
    queryKey: exchangeKeys.detail(id),
    queryFn: () => fetchExchangeDetail(id),
  });
}

/** Presigned `url`s are short-lived — don't let this sit stale as long as most queries. */
export function useExchangeEvidence(id: string) {
  return useQuery({
    queryKey: exchangeKeys.evidence(id),
    queryFn: () => fetchExchangeEvidence(id),
    staleTime: 10_000,
  });
}
