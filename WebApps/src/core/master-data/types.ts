/**
 * Mirrors `Backend/src/modules/master-data/dto/master-data-response.dto.ts`.
 *
 * `id`/`code`/`name` is the part *every* collection has, and is all an id-to-
 * label resolver needs — which is why it is its own type rather than folded
 * into `MasterDataRow`. `Supplier` has exactly this and nothing more of the
 * common shape: it carries no `status`, deliberately
 * (`.scratch/receiving-supplier/spec.md` decision 6 — a supplier is never
 * deactivated). Splitting the base is what lets suppliers use `useLookup` and
 * `displayLabel` without anyone inventing a lifecycle for them.
 */
export interface MasterDataIdentity {
  id: string;
  code: string;
  name: string;
}

/**
 * Identity plus a lifecycle. Every collection but `suppliers` has one, which
 * is what `StatusBadge`, the status filters and the activate/deactivate pairs
 * key off.
 */
export interface MasterDataRow extends MasterDataIdentity {
  status: "ACTIVE" | "INACTIVE";
}

export interface Factory extends MasterDataRow {
  description: string | null;
  timezone: string;
}

/**
 * The three kinds of place stock can sit. Mirrors Prisma's `LocationType`, and
 * is also what `GET /locations?locationType=` accepts — one definition, so a
 * filter value can never drift from a row value.
 */
export type LocationType = "WAREHOUSE" | "TROLLEY" | "USED_NEEDLE_STORAGE";

export interface Location extends MasterDataRow {
  factoryId: string;
  locationType: LocationType;
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
 * Who stock was received from (`Docs/12` §9 "Supplier").
 *
 * **Extends `MasterDataIdentity`, not `MasterDataRow`, because there is no
 * `status` — not here, not in `SupplierResponseDto`, not in the table.** A
 * supplier is never deactivated (`.scratch/receiving-supplier/spec.md`
 * decision 6): historical receivings point at the row, so renaming is the only
 * correction. Every sibling collection carries `EntityStatus`, so this absence
 * is written down rather than left to look like an omission to fix.
 */
export interface Supplier extends MasterDataIdentity {
  /** One line — a phone number or an email. Not a contact-management subsystem. */
  contact: string | null;
  description: string | null;
}

/**
 * The seven paths the backend registers. Used as both the request path and the
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
  "suppliers",
] as const;

export type MasterDataCollection = (typeof MASTER_DATA_COLLECTIONS)[number];

export interface MasterDataRowTypes {
  factories: Factory;
  locations: Location;
  trolleys: Trolley;
  "needle-types": NeedleType;
  "exchange-types": ExchangeType;
  employees: Employee;
  suppliers: Supplier;
}

/**
 * Every collection whose endpoint takes at least one filter. `suppliers` is
 * the one that takes none — `GET /suppliers` accepts `page`/`pageSize` and
 * answers any other parameter with a 400 — so a component that offers
 * filtering (the shared read-only `MasterDataScreen` shell and its factory
 * scope) is generic over this rather than over every collection.
 */
export type FilterableCollection = Exclude<MasterDataCollection, "suppliers">;

/**
 * Only the collections that carry a `factoryId`. `needle-types`,
 * `exchange-types` and `suppliers` are business-wide catalogues with no
 * factory column — the backend rejects a `factoryId` filter on them with a 400
 * rather than accepting and ignoring it, so this type keeps that boundary in
 * the client too.
 */
export type ScopedCollection = "factories" | "locations" | "trolleys" | "employees";
