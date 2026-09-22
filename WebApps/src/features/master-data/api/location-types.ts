/**
 * Location's write shapes, mirroring `CreateLocationDto` / `UpdateLocationDto`
 * in `Backend/src/modules/master-data/dto/master-data-request.dto.ts` and
 * `Docs/12-OpenAPI-Swagger-Specification.md` "## Location". Reads already fit
 * `core/master-data`'s `Location` — only the request DTOs are new.
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/**
 * `TROLLEY` is deliberately absent: a trolley location is born with its
 * trolley through `POST /trolleys` (ADR-003), and `POST /locations` refuses
 * it with a 400.
 */
export const CREATABLE_LOCATION_TYPES = ["WAREHOUSE", "USED_NEEDLE_STORAGE"] as const;
export type CreatableLocationType = (typeof CREATABLE_LOCATION_TYPES)[number];

/** `CreateLocationDto`. `code`/`factoryId`/`locationType` are immutable after create. */
export interface CreateLocationInput {
  factoryId: string;
  parentLocationId?: string | null;
  code: string;
  name: string;
  locationType: CreatableLocationType;
}

/** `UpdateLocationDto` — `parentLocationId: null` detaches the location from its parent. */
export interface UpdateLocationInput {
  name?: string;
  parentLocationId?: string | null;
  status?: EntityStatus;
}

