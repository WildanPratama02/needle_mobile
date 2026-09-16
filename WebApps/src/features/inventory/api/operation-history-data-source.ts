import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import { toDateBound } from "../lib/date-bounds";
import type {
  AdjustmentDetail,
  AdjustmentHistoryItem,
  AdjustmentListFilters,
  OperationHistoryFilters,
  Paged,
  ReturnHistoryItem,
  TransferHistoryItem,
  UploadedEvidence,
} from "./operation-history-types";

/**
 * The history reads for Transfer, Stock Return and Adjustment, plus the
 * Adjustment evidence upload — the single seam for these routes, nothing calls
 * `apiClient` for them directly. Contract: `.scratch/inventory-operation-history/spec.md`.
 */

function historyParams(filters: OperationHistoryFilters) {
  return {
    factoryId: filters.factoryId === "all" || filters.factoryId === "" ? undefined : filters.factoryId,
    locationId: filters.locationId || undefined,
    needleTypeId: filters.needleTypeId || undefined,
    dateFrom: toDateBound(filters.dateFrom, "start"),
    dateTo: toDateBound(filters.dateTo, "end"),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

function toPaged<T>(body: ApiSuccessBody<T[]>, filters: OperationHistoryFilters): Paged<T> {
  return {
    items: body.data,
    page: body.meta.page ?? filters.page,
    pageSize: body.meta.pageSize ?? filters.pageSize,
    total: body.meta.total ?? 0,
    totalPages: body.meta.totalPages ?? 0,
  };
}

/** `GET /inventory/transfers` — `STOCK_VIEW`. `locationId` matches source or destination. */
export async function fetchTransfers(filters: OperationHistoryFilters): Promise<Paged<TransferHistoryItem>> {
  const { data } = await apiClient.get<ApiSuccessBody<TransferHistoryItem[]>>("/inventory/transfers", {
    params: historyParams(filters),
  });
  return toPaged(data, filters);
}

/** `GET /inventory/transfers/{transferId}` — 404 if missing or out of scope. */
export async function fetchTransfer(id: string): Promise<TransferHistoryItem> {
  const { data } = await apiClient.get<ApiSuccessBody<TransferHistoryItem>>(`/inventory/transfers/${id}`);
  return data.data;
}

/** `GET /inventory/returns` — same filters, permission and shape as Transfer, `reason` in place of `note`. */
export async function fetchReturns(filters: OperationHistoryFilters): Promise<Paged<ReturnHistoryItem>> {
  const { data } = await apiClient.get<ApiSuccessBody<ReturnHistoryItem[]>>("/inventory/returns", {
    params: historyParams(filters),
  });
  return toPaged(data, filters);
}

/** `GET /inventory/returns/{returnId}`. */
export async function fetchReturn(id: string): Promise<ReturnHistoryItem> {
  const { data } = await apiClient.get<ApiSuccessBody<ReturnHistoryItem>>(`/inventory/returns/${id}`);
  return data.data;
}

/** `GET /inventory/adjustments` — `STOCK_VIEW`. Rows are keyed by the ADJUSTMENT movement id. */
export async function fetchAdjustments(filters: AdjustmentListFilters): Promise<Paged<AdjustmentHistoryItem>> {
  const { data } = await apiClient.get<ApiSuccessBody<AdjustmentHistoryItem[]>>("/inventory/adjustments", {
    params: {
      ...historyParams(filters),
      reasonCode: filters.reasonCode === "ALL" ? undefined : filters.reasonCode,
    },
  });
  return toPaged(data, filters);
}

/** `GET /inventory/adjustments/{id}` — row shape plus `evidence[]` with presigned URLs. */
export async function fetchAdjustment(id: string): Promise<AdjustmentDetail> {
  const { data } = await apiClient.get<ApiSuccessBody<AdjustmentDetail>>(`/inventory/adjustments/${id}`);
  return data.data;
}

/**
 * `POST /inventory/adjustments/evidence` — `STOCK_ADJUST`, multipart. The
 * explicit multipart header matters: `apiClient` defaults to JSON, and axios
 * would otherwise serialise the `FormData` as a JSON object. Axios drops the
 * header's value in the browser so the boundary is set correctly. The shared
 * interceptor still attaches the Idempotency-Key.
 */
export async function uploadAdjustmentEvidence(input: { factoryId: string; file: File }): Promise<UploadedEvidence> {
  const body = new FormData();
  body.append("file", input.file);
  body.append("factoryId", input.factoryId);

  const { data } = await apiClient.post<ApiSuccessBody<UploadedEvidence>>("/inventory/adjustments/evidence", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}
