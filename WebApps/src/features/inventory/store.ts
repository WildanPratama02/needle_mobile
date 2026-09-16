import * as React from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { CountSessionStatus } from "./api/count-session-types";
import type { AdjustmentReasonCode } from "./api/operation-history-types";
import type { BalanceListFilters, MovementListFilters, MovementType } from "./api/types";

const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Stock Overview — GET /inventory/balances
// ---------------------------------------------------------------------------

interface StockOverviewFilterState {
  locationId: string;
  trolleyId: string;
  needleTypeId: string;
  lowStock: boolean;
  page: number;
  pageSize: number;
  /** Clears `trolleyId` too — the backend 400s if both are set and disagree (`ListBalancesQueryDto`). */
  setLocationId: (locationId: string) => void;
  /** Clears `locationId` too, same reason. */
  setTrolleyId: (trolleyId: string) => void;
  setNeedleTypeId: (needleTypeId: string) => void;
  setLowStock: (lowStock: boolean) => void;
  setPage: (page: number) => void;
}

export const useStockOverviewFilterStore = create<StockOverviewFilterState>((set) => ({
  locationId: "",
  trolleyId: "",
  needleTypeId: "",
  lowStock: false,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  setLocationId: (locationId) => set({ locationId, trolleyId: "" }),
  setTrolleyId: (trolleyId) => set({ trolleyId, locationId: "" }),
  setNeedleTypeId: (needleTypeId) => set({ needleTypeId }),
  setLowStock: (lowStock) => set({ lowStock }),
  setPage: (page) => set({ page }),
}));

export function useStockOverviewFilters(): BalanceListFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const locationId = useStockOverviewFilterStore((s) => s.locationId);
  const trolleyId = useStockOverviewFilterStore((s) => s.trolleyId);
  const needleTypeId = useStockOverviewFilterStore((s) => s.needleTypeId);
  const lowStock = useStockOverviewFilterStore((s) => s.lowStock);
  const page = useStockOverviewFilterStore((s) => s.page);
  const pageSize = useStockOverviewFilterStore((s) => s.pageSize);
  const setPage = useStockOverviewFilterStore((s) => s.setPage);

  const signature = `${factoryId}|${locationId}|${trolleyId}|${needleTypeId}|${lowStock}`;
  const previousSignature = React.useRef(signature);

  React.useEffect(() => {
    if (previousSignature.current !== signature) {
      previousSignature.current = signature;
      setPage(1);
    }
  }, [signature, setPage]);

  return { factoryId, locationId, trolleyId, needleTypeId, lowStock, page, pageSize };
}

// ---------------------------------------------------------------------------
// Stock Movement — GET /inventory/movements
// ---------------------------------------------------------------------------

interface StockMovementFilterState {
  locationId: string;
  trolleyId: string;
  needleTypeId: string;
  movementType: MovementType | "ALL";
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  setLocationId: (locationId: string) => void;
  setTrolleyId: (trolleyId: string) => void;
  setNeedleTypeId: (needleTypeId: string) => void;
  setMovementType: (movementType: MovementType | "ALL") => void;
  setDateFrom: (dateFrom: string) => void;
  setDateTo: (dateTo: string) => void;
  setPage: (page: number) => void;
}

export const useStockMovementFilterStore = create<StockMovementFilterState>((set) => ({
  locationId: "",
  trolleyId: "",
  needleTypeId: "",
  movementType: "ALL",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  setLocationId: (locationId) => set({ locationId, trolleyId: "" }),
  setTrolleyId: (trolleyId) => set({ trolleyId, locationId: "" }),
  setNeedleTypeId: (needleTypeId) => set({ needleTypeId }),
  setMovementType: (movementType) => set({ movementType }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  setPage: (page) => set({ page }),
}));

export function useStockMovementFilters(): MovementListFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const locationId = useStockMovementFilterStore((s) => s.locationId);
  const trolleyId = useStockMovementFilterStore((s) => s.trolleyId);
  const needleTypeId = useStockMovementFilterStore((s) => s.needleTypeId);
  const movementType = useStockMovementFilterStore((s) => s.movementType);
  const dateFrom = useStockMovementFilterStore((s) => s.dateFrom);
  const dateTo = useStockMovementFilterStore((s) => s.dateTo);
  const page = useStockMovementFilterStore((s) => s.page);
  const pageSize = useStockMovementFilterStore((s) => s.pageSize);
  const setPage = useStockMovementFilterStore((s) => s.setPage);

  const signature = `${factoryId}|${locationId}|${trolleyId}|${needleTypeId}|${movementType}|${dateFrom}|${dateTo}`;
  const previousSignature = React.useRef(signature);

  React.useEffect(() => {
    if (previousSignature.current !== signature) {
      previousSignature.current = signature;
      setPage(1);
    }
  }, [signature, setPage]);

  return { factoryId, locationId, trolleyId, needleTypeId, movementType, dateFrom, dateTo, page, pageSize };
}

// ---------------------------------------------------------------------------
// Operation history — Transfer, Stock Return, Adjustment, Physical Count
// (`.scratch/inventory-operation-history/spec.md` decision 1)
// ---------------------------------------------------------------------------

/**
 * One filter-state shape for every history-first screen: location, needle
 * type, date range and page, plus whatever a single screen adds on top
 * (`extra` — Adjustment's reason code, Physical Count's status tab). Factory
 * scope stays TopBar's job, read from `factory-scope-store`, same as the
 * ledger. Ephemeral UI state only — the rows themselves live in TanStack Query.
 */
export interface HistoryFilterState<E extends Record<string, string>> {
  locationId: string;
  needleTypeId: string;
  /** "" = omit. `yyyy-MM-dd` from a native date input. */
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  extra: E;
  setLocationId: (locationId: string) => void;
  setNeedleTypeId: (needleTypeId: string) => void;
  setDateFrom: (dateFrom: string) => void;
  setDateTo: (dateTo: string) => void;
  setExtra: <K extends keyof E>(key: K, value: E[K]) => void;
  setPage: (page: number) => void;
}

export type HistoryFilterStore<E extends Record<string, string>> = UseBoundStore<StoreApi<HistoryFilterState<E>>>;

export function createHistoryFilterStore<E extends Record<string, string>>(extraDefaults: E): HistoryFilterStore<E> {
  return create<HistoryFilterState<E>>((set) => ({
    locationId: "",
    needleTypeId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    extra: extraDefaults,
    setLocationId: (locationId) => set({ locationId }),
    setNeedleTypeId: (needleTypeId) => set({ needleTypeId }),
    setDateFrom: (dateFrom) => set({ dateFrom }),
    setDateTo: (dateTo) => set({ dateTo }),
    setExtra: (key, value) => set((state) => ({ extra: { ...state.extra, [key]: value } as E })),
    setPage: (page) => set({ page }),
  }));
}

/** Reads a history store plus TopBar's factory, and snaps back to page 1 whenever any filter changes — same rule as the ledger's filters. */
export function useHistoryFilters<E extends Record<string, string>>(store: HistoryFilterStore<E>) {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const locationId = store((s) => s.locationId);
  const needleTypeId = store((s) => s.needleTypeId);
  const dateFrom = store((s) => s.dateFrom);
  const dateTo = store((s) => s.dateTo);
  const page = store((s) => s.page);
  const pageSize = store((s) => s.pageSize);
  const extra = store((s) => s.extra);
  const setPage = store((s) => s.setPage);

  const signature = `${factoryId}|${locationId}|${needleTypeId}|${dateFrom}|${dateTo}|${JSON.stringify(extra)}`;
  const previousSignature = React.useRef(signature);

  React.useEffect(() => {
    if (previousSignature.current !== signature) {
      previousSignature.current = signature;
      setPage(1);
    }
  }, [signature, setPage]);

  return { factoryId, locationId, needleTypeId, dateFrom, dateTo, page, pageSize, extra };
}

export const useTransferHistoryFilterStore = createHistoryFilterStore<Record<string, never>>({});
export const useReturnHistoryFilterStore = createHistoryFilterStore<Record<string, never>>({});
export const useAdjustmentHistoryFilterStore = createHistoryFilterStore<{ reasonCode: AdjustmentReasonCode | "ALL" }>({
  reasonCode: "ALL",
});
/** Lands on the Open tab — the landing list's first job is resuming an unfinished count. */
export const useCountSessionFilterStore = createHistoryFilterStore<{ status: CountSessionStatus | "ALL" }>({
  status: "OPEN",
});
