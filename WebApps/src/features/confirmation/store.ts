import * as React from "react";
import { create } from "zustand";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { ConfirmationListFilters, ConfirmationStatus } from "./api/types";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Ephemeral UI filter state local to this screen: Status tab + paging.
 * Factory scope is global-header state (Docs/18 §6), read from
 * core/permissions/factory-scope-store — not duplicated here, same rule as
 * Dashboard and Exchange Transactions.
 */
interface ConfirmationFilterState {
  status: ConfirmationStatus;
  page: number;
  pageSize: number;
  setStatus: (status: ConfirmationStatus) => void;
  setPage: (page: number) => void;
}

export const useConfirmationFilterStore = create<ConfirmationFilterState>((set) => ({
  status: "PENDING",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  setStatus: (status) => set({ status }),
  setPage: (page) => set({ page }),
}));

/** Resets to page 1 whenever Factory or Status changes — a stale page number for a new filter set may not exist. */
export function useConfirmationFilters(): ConfirmationListFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const status = useConfirmationFilterStore((s) => s.status);
  const page = useConfirmationFilterStore((s) => s.page);
  const pageSize = useConfirmationFilterStore((s) => s.pageSize);
  const setPage = useConfirmationFilterStore((s) => s.setPage);

  const filterSignature = `${factoryId}|${status}`;
  const previousSignature = React.useRef(filterSignature);

  React.useEffect(() => {
    if (previousSignature.current !== filterSignature) {
      previousSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature, setPage]);

  return { factoryId, status, page, pageSize };
}
