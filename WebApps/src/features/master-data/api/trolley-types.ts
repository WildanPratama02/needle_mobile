/**
 * Trolley's write shapes (ticket 03,
 * `.scratch/admin-panel-crud/issues/03-master-data-trolley-crud.md`). Reads
 * already fit `core/master-data`'s `Trolley`/`MasterDataRow` shape — only
 * the request DTOs are new, mirroring `Docs/12-OpenAPI-Swagger-Specification.md`
 * §9 "Trolley". No `activate`/`deactivate` pair is documented for Trolley
 * (unlike Factory/Needle Type) — status changes go through `PATCH`'s
 * `status` field instead; this ticket does not invent an endpoint pair the
 * contract doesn't have.
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/** `CreateTrolleyDto`. `code`/`factoryId` are the row's identity and are immutable after create. */
export interface CreateTrolleyInput {
  factoryId: string;
  code: string;
  name: string;
}

/** `UpdateTrolleyDto` — `code`/`factoryId` deliberately absent, set-once. */
export interface UpdateTrolleyInput {
  name?: string;
  locationId?: string;
  status?: EntityStatus;
}
