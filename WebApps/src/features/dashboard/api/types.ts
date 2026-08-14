/**
 * Shapes for Docs/12-OpenAPI-Swagger-Specification.md §15 (Dashboard API).
 *
 * `DashboardOverview` and `ExchangeTrendPoint` are copied field-for-field
 * from the contract's example JSON. `NeedleConsumptionItem` and
 * `StockSummary` are NOT — the contract only says what those two endpoints
 * "return by" (Factory/Trolley/Needle Type/Date) without an example payload,
 * so these two are this feature's best-guess shape, not a verified contract.
 * Flagged as a Backend Reporting Contract Gap (see WebApps/README or the
 * implementation report) — confirm against the real response once
 * Backend/src/modules/reporting ships and adjust here, which is the only
 * place these shapes are defined.
 */

export interface DashboardFilters {
  factoryId: string | "all";
  dateFrom: string;
  dateTo: string;
}

export interface DashboardOverview {
  totalExchanges: number;
  brokenNeedles: number;
  bentNeedles: number;
  changeovers: number;
  pendingConfirmations: number;
  lowStockItems: number;
}

export interface ExchangeTrendPoint {
  date: string;
  total: number;
  broken: number;
  bent: number;
  changeover: number;
}

/** Inferred shape — see file header. */
export interface NeedleConsumptionItem {
  needleTypeId: string;
  needleTypeCode: string;
  needleTypeName: string;
  consumption: number;
}

/** Inferred shape — see file header. */
export interface StockAlertItem {
  id: string;
  needleTypeCode: string;
  needleTypeName: string;
  factoryName: string;
  locationName: string;
  balance: number;
  minimumStock: number;
  status: "LOW" | "OUT_OF_STOCK";
}

/** Inferred shape — see file header. */
export interface StockSummary {
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: StockAlertItem[];
  outOfStockItems: StockAlertItem[];
}
