import { useQuery } from "@tanstack/react-query";

import type { DashboardFilters } from "./types";
import {
  fetchDashboardOverview,
  fetchExchangeTrend,
  fetchNeedleConsumption,
  fetchStockSummary,
} from "./data-source";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: (filters: DashboardFilters) => [...dashboardKeys.all, "overview", filters] as const,
  trend: (filters: DashboardFilters) => [...dashboardKeys.all, "exchange-trend", filters] as const,
  consumption: (filters: DashboardFilters) => [...dashboardKeys.all, "needle-consumption", filters] as const,
  stock: (filters: DashboardFilters) => [...dashboardKeys.all, "stock-summary", filters] as const,
};

export function useDashboardOverview(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.overview(filters),
    queryFn: () => fetchDashboardOverview(filters),
  });
}

export function useExchangeTrend(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.trend(filters),
    queryFn: () => fetchExchangeTrend(filters),
  });
}

export function useNeedleConsumption(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.consumption(filters),
    queryFn: () => fetchNeedleConsumption(filters),
  });
}

export function useStockSummary(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.stock(filters),
    queryFn: () => fetchStockSummary(filters),
  });
}
