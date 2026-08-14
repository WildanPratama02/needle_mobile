import type {
  DashboardFilters,
  DashboardOverview,
  ExchangeTrendPoint,
  NeedleConsumptionItem,
  StockSummary,
} from "./types";
import {
  FIXTURE_OVERVIEW,
  FIXTURE_EXCHANGE_TREND,
  FIXTURE_NEEDLE_CONSUMPTION,
  FIXTURE_STOCK_SUMMARY,
} from "./fixtures";

/**
 * THE swap seam. `queries.ts` (and every component) only ever calls these
 * four functions — never `fixtures.ts` or `apiClient` directly — so wiring
 * up the real Backend once `Backend/src/modules/reporting` ships is a
 * same-signature body swap in this file only, e.g.:
 *
 *   export async function fetchDashboardOverview(filters: DashboardFilters) {
 *     const { data } = await apiClient.get<{ data: DashboardOverview }>("/dashboard/overview", {
 *       params: { factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
 *                 dateFrom: filters.dateFrom, dateTo: filters.dateTo },
 *     });
 *     return data.data;
 *   }
 *
 * Backend isn't there yet (Backend/src/modules/reporting is an empty
 * placeholder), so every function below resolves a fixture instead, with a
 * short artificial delay so loading states are actually exercisable.
 */

const FIXTURE_LATENCY_MS = 400;

function delayed<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FIXTURE_LATENCY_MS));
}

export async function fetchDashboardOverview(_filters: DashboardFilters): Promise<DashboardOverview> {
  return delayed(FIXTURE_OVERVIEW);
}

export async function fetchExchangeTrend(_filters: DashboardFilters): Promise<ExchangeTrendPoint[]> {
  return delayed(FIXTURE_EXCHANGE_TREND);
}

export async function fetchNeedleConsumption(_filters: DashboardFilters): Promise<NeedleConsumptionItem[]> {
  return delayed(FIXTURE_NEEDLE_CONSUMPTION);
}

export async function fetchStockSummary(_filters: DashboardFilters): Promise<StockSummary> {
  return delayed(FIXTURE_STOCK_SUMMARY);
}
