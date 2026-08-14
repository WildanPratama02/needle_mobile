import * as React from "react";
import { create } from "zustand";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { ExchangeListFilters, ExchangeState } from "./api/types";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Ephemeral UI filter state local to this screen: Trolley + Status + paging.
 * Factory scope is global-header state (Docs/18 §6, same rule Dashboard
 * follows) — read from core/permissions/factory-scope-store, not duplicated.
 */
interface TransactionsFilterState {
  trolleyId: string;
  status: ExchangeState | "ALL";
  page: number;
  pageSize: number;
  setTrolleyId: (trolleyId: string) => void;
  setStatus: (status: ExchangeState | "ALL") => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useTransactionsFilterStore = create<TransactionsFilterState>((set) => ({
  trolleyId: "",
  status: "ALL",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  setTrolleyId: (trolleyId) => set({ trolleyId }),
  setStatus: (status) => set({ status }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
}));

/**
 * The single place store state becomes the `ExchangeListFilters` the query
 * hook/API expect, and where changing a filter resets paging back to page 1
 * — changing Factory/Trolley/Status with a stale page number would silently
 * request a page that may not exist for the new filter set.
 */
export function useExchangeFilters(): ExchangeListFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const trolleyId = useTransactionsFilterStore((s) => s.trolleyId);
  const status = useTransactionsFilterStore((s) => s.status);
  const page = useTransactionsFilterStore((s) => s.page);
  const pageSize = useTransactionsFilterStore((s) => s.pageSize);
  const setPage = useTransactionsFilterStore((s) => s.setPage);
  const setTrolleyId = useTransactionsFilterStore((s) => s.setTrolleyId);

  const filterSignature = `${factoryId}|${trolleyId}|${status}`;
  const previousSignature = React.useRef(filterSignature);

  React.useEffect(() => {
    if (previousSignature.current !== filterSignature) {
      previousSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature, setPage]);

  // A trolley belongs to exactly one factory, so a selection made under the
  // previous factory scope can only ever return nothing once the scope moves.
  const previousFactoryId = React.useRef(factoryId);

  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      setTrolleyId("");
    }
  }, [factoryId, setTrolleyId]);

  return { factoryId, trolleyId, status, page, pageSize };
}
