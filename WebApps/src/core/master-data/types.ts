/**
 * Mirrors `Backend/src/modules/master-data/dto/master-data-response.dto.ts`.
 *
 * Every master-data row shares `id`/`code`/`name`/`status`, which is what lets
 * one lookup layer resolve any id to a label instead of six near-identical
 * ones. The per-collection extras below are additive on top of that shape.
 */
export interface MasterDataRow {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Factory extends MasterDataRow {
  description: string | null;
  timezone: string;
}

export interface Location extends MasterDataRow {
  factoryId: string;
  locationType: "WAREHOUSE" | "TROLLEY" | "USED_NEEDLE_STORAGE";
  parentLocationId: string | null;
}

export interface Trolley extends MasterDataRow {
  factoryId: string;
  locationId: string;
}

export interface NeedleType extends MasterDataRow {
  category: string | null;
  unit: string;
  minimumStock: number;
  description: string | null;
}

export interface ExchangeType extends MasterDataRow {
  requiresFragmentValidation: boolean;
  description: string | null;
}

export interface Employee extends MasterDataRow {
  factoryId: string;
  /** Same value as `code` — the domain's own name for it. */
  employeeNumber: string;
  department: string | null;
}

/**
 * The six paths the backend registers. Used as both the request path and the
 * query-key segment, so a typo cannot make a cache entry disagree with the
 * endpoint that filled it.
 */
export const MASTER_DATA_COLLECTIONS = [
  "factories",
  "locations",
  "trolleys",
  "needle-types",
  "exchange-types",
  "employees",
] as const;

export type MasterDataCollection = (typeof MASTER_DATA_COLLECTIONS)[number];

export interface MasterDataRowTypes {
  factories: Factory;
  locations: Location;
  trolleys: Trolley;
  "needle-types": NeedleType;
  "exchange-types": ExchangeType;
  employees: Employee;
}

/**
 * Only the collections that carry a `factoryId`. `needle-types` and
 * `exchange-types` are business-wide catalogues with no factory column — the
 * backend rejects a `factoryId` filter on them with a 400 rather than
 * accepting and ignoring it, so this type keeps that boundary in the client
 * too.
 */
export type ScopedCollection = "factories" | "locations" | "trolleys" | "employees";
