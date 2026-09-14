/**
 * Needle Type's write shapes (ticket 01,
 * `.scratch/admin-panel-crud/issues/01-master-data-needle-type-crud.md`).
 * Reads already fit `core/master-data`'s `NeedleType`/`MasterDataRow` shape —
 * only the request DTOs are new, mirroring `CreateNeedleTypeDto`/
 * `UpdateNeedleTypeDto` as documented in
 * `Docs/12-OpenAPI-Swagger-Specification.md` §9 "Needle Type".
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/** `CreateNeedleTypeDto`. `code` is the row's identity and is immutable after create. */
export interface CreateNeedleTypeInput {
  code: string;
  name: string;
  category?: string;
  unit: string;
  minimumStock: number;
  description?: string;
}

/** `UpdateNeedleTypeDto` — `code` deliberately absent, set-once (ticket 01 acceptance: "code is immutable after create"). */
export interface UpdateNeedleTypeInput {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  minimumStock?: number;
}
