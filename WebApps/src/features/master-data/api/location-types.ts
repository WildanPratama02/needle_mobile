import type { Location } from "@/core/master-data";

/**
 * Location's write shapes
 * (`.scratch/inventory-location-master-data/issues/01-location-master-data-crud.md`).
 * Reads already fit `core/master-data`'s `Location`/`MasterDataRow` shape —
 * only the request DTOs are new, mirroring
 * `Docs/12-OpenAPI-Swagger-Specification.md` §9 "Location" and
 * `Backend/src/modules/master-data/dto/master-data-request.dto.ts`
 * (`CreateLocationDto`/`UpdateLocationDto`).
 *
 * No `activate`/`deactivate` pair is contracted for Location (as it is for
 * Factory and Needle Type) — status changes go through `PATCH`'s `status`
 * field, so this ticket does not invent an endpoint pair the contract does
 * not have.
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/** Derived from the read model rather than redeclared — one definition of the enum, not two. */
export type LocationType = Location["locationType"];

/**
 * The two types `POST /locations` accepts. `TROLLEY` is refused with a 400:
 * a trolley owns its own location (ADR-003), created by `POST /trolleys` and
 * edited through `PATCH /trolleys/{trolleyId}`, so the two can never disagree
 * about `Trolley.locationId`.
 */
export const CREATABLE_LOCATION_TYPES = ["WAREHOUSE", "USED_NEEDLE_STORAGE"] as const;
export type CreatableLocationType = (typeof CREATABLE_LOCATION_TYPES)[number];

/** Every `LocationType` the backend can return, for the list filter. */
export const LOCATION_TYPES = ["WAREHOUSE", "TROLLEY", "USED_NEEDLE_STORAGE"] as const;

/**
 * One label per enum value, so the table cell, the filter and the create form
 * all read the same words. Humanized enum names — not invented meanings.
 */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  WAREHOUSE: "Warehouse",
  TROLLEY: "Trolley",
  USED_NEEDLE_STORAGE: "Used Needle Storage",
};

/** `CreateLocationDto`. `code` and `locationType` are the row's identity and are immutable after create. */
export interface CreateLocationInput {
  factoryId: string;
  code: string;
  name: string;
  locationType: CreatableLocationType;
  parentLocationId?: string;
}

/** `UpdateLocationDto` — `code`, `locationType` and `factoryId` deliberately absent, set-once. */
export interface UpdateLocationInput {
  name?: string;
  parentLocationId?: string;
  status?: EntityStatus;
}
