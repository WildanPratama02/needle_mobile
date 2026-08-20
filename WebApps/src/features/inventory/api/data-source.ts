import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type {
  AdjustmentResult,
  BalanceItem,
  BalanceListFilters,
  CreateAdjustmentInput,
  CreateReceivingInput,
  CreateTransferInput,
  MovementItem,
  MovementListFilters,
  PagedBalances,
  PagedMovements,
  ReceivingResult,
  TransferResult,
  TrolleyStock,
} from "./types";

/**
 * The single seam for every `/inventory/*` call — `queries.ts` and every
 * inventory screen go through here, nothing calls `apiClient` directly.
 * Real endpoints, verified against `Backend/src/modules/inventory/
 * controllers/inventory.controller.ts` (commit `0bf8988`), not Docs/12.
 */

export async function fetchBalances(filters: BalanceListFilters): Promise<PagedBalances> {
  const { data } = await apiClient.get<ApiSuccessBody<BalanceItem[]>>("/inventory/balances", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      locationId: filters.locationId === "" ? undefined : filters.locationId,
      trolleyId: filters.trolleyId === "" ? undefined : filters.trolleyId,
      needleTypeId: filters.needleTypeId === "" ? undefined : filters.needleTypeId,
      lowStock: filters.lowStock ? true : undefined,
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
  };
}

/** `GET /inventory/trolleys/:trolleyId` — Stock Overview's drill-down. */
export async function fetchTrolleyStock(trolleyId: string): Promise<TrolleyStock> {
  const { data } = await apiClient.get<ApiSuccessBody<TrolleyStock>>(`/inventory/trolleys/${trolleyId}`);
  return data.data;
}

export async function fetchMovements(filters: MovementListFilters): Promise<PagedMovements> {
  const { data } = await apiClient.get<ApiSuccessBody<MovementItem[]>>("/inventory/movements", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      locationId: filters.locationId === "" ? undefined : filters.locationId,
      trolleyId: filters.trolleyId === "" ? undefined : filters.trolleyId,
      needleTypeId: filters.needleTypeId === "" ? undefined : filters.needleTypeId,
      movementType: filters.movementType === "ALL" ? undefined : filters.movementType,
      dateFrom: filters.dateFrom === "" ? undefined : filters.dateFrom,
      dateTo: filters.dateTo === "" ? undefined : filters.dateTo,
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
  };
}

/** `POST /inventory/receivings` — `STOCK_RECEIVE`. Idempotency-Key is attached automatically by the shared apiClient interceptor. */
export async function createReceiving(input: CreateReceivingInput): Promise<ReceivingResult> {
  const { data } = await apiClient.post<ApiSuccessBody<ReceivingResult>>("/inventory/receivings", input);
  return data.data;
}

/** `POST /inventory/transfers` — `STOCK_TRANSFER`. 400 on same source/destination, 409 (`INVENTORY_INSUFFICIENT_STOCK`) on insufficient source stock. */
export async function createTransfer(input: CreateTransferInput): Promise<TransferResult> {
  const { data } = await apiClient.post<ApiSuccessBody<TransferResult>>("/inventory/transfers", input);
  return data.data;
}

/** `POST /inventory/adjustments` — `STOCK_ADJUST`. Applies immediately, no approval step. */
export async function createAdjustment(input: CreateAdjustmentInput): Promise<AdjustmentResult> {
  const { data } = await apiClient.post<ApiSuccessBody<AdjustmentResult>>("/inventory/adjustments", input);
  return data.data;
}
