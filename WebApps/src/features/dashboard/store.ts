import { create } from "zustand";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { DashboardFilters } from "./api/types";

export type DashboardPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH";

export const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  TODAY: "Today",
  THIS_WEEK: "This Week",
  THIS_MONTH: "This Month",
};

/**
 * Ephemeral UI filter state local to this screen: Period only. Factory
 * scope is global-header state (Docs/18 §6) — read from
 * core/permissions/factory-scope-store, not duplicated here. `lastUpdatedAt`
 * is UI-only too, just timestamping the last successful manual refresh.
 */
interface DashboardFilterState {
  period: DashboardPeriod;
  lastUpdatedAt: number | null;
  setPeriod: (period: DashboardPeriod) => void;
  markRefreshed: () => void;
}

export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  period: "TODAY",
  lastUpdatedAt: null,
  setPeriod: (period) => set({ period }),
  markRefreshed: () => set({ lastUpdatedAt: Date.now() }),
}));

function periodToRange(period: DashboardPeriod): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = format(now, "yyyy-MM-dd");
  const start =
    period === "TODAY" ? startOfDay(now) : period === "THIS_WEEK" ? startOfWeek(now) : startOfMonth(now);
  return { dateFrom: format(start, "yyyy-MM-dd"), dateTo };
}

/** The single place store state becomes the `DashboardFilters` the query hooks/API expect. */
export function useDashboardFilters(): DashboardFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const period = useDashboardFilterStore((s) => s.period);
  const { dateFrom, dateTo } = periodToRange(period);
  return { factoryId, dateFrom, dateTo };
}
