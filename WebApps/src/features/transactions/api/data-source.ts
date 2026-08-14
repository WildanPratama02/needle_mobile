import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { ExchangeDetail, ExchangeListFilters, ExchangeListItem, EvidenceItem, PagedExchanges } from "./types";

/**
 * Real call, not a fixture — `GET /exchanges` is implemented server-side
 * (Backend/src/modules/exchange), unlike Dashboard's `/dashboard/*`. Still
 * lives in its own `data-source.ts`, same seam pattern as Dashboard, so any
 * future endpoint change is a body edit here only.
 *
 * No `sortBy`/`sortOrder` param exists on this endpoint (ListExchangesQueryDto
 * has none) — never add one here without confirming Backend added it first.
 */
export async function fetchExchanges(filters: ExchangeListFilters): Promise<PagedExchanges> {
  const { data } = await apiClient.get<ApiSuccessBody<ExchangeListItem[]>>("/exchanges", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      trolleyId: filters.trolleyId.trim() === "" ? undefined : filters.trolleyId.trim(),
      status: filters.status === "ALL" ? undefined : filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });

  return {
    items: data.data,
    page: data.meta.page ?? filters.page,
    pageSize: data.meta.pageSize ?? filters.pageSize,
    total: data.meta.total ?? 0,
    totalPages: data.meta.totalPages ?? 0,
    requestId: data.meta.requestId,
  };
}

/** `GET /exchanges/:id` — exchange.controller.ts:191, `EXCHANGE_VIEW`. */
export async function fetchExchangeDetail(id: string): Promise<ExchangeDetail> {
  const { data } = await apiClient.get<ApiSuccessBody<ExchangeDetail>>(`/exchanges/${id}`);
  return data.data;
}

/** `GET /exchanges/:id/evidence` — evidence.controller.ts:105, `EXCHANGE_VIEW`. Presigned `url`s are short-lived; refetch rather than cache long. */
export async function fetchExchangeEvidence(exchangeId: string): Promise<EvidenceItem[]> {
  const { data } = await apiClient.get<ApiSuccessBody<EvidenceItem[]>>(`/exchanges/${exchangeId}/evidence`);
  return data.data;
}
