import * as React from "react";
import { create } from "zustand";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
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
