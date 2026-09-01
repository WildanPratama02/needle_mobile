/**
 * Factory's write shapes (ticket 02,
 * `.scratch/admin-panel-crud/issues/02-master-data-factory-crud.md`). Reads
 * already fit `core/master-data`'s `Factory`/`MasterDataRow` shape — only the
 * request DTOs are new, mirroring `Docs/12-OpenAPI-Swagger-Specification.md`
 * §9 "Factory".
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/** `CreateFactoryDto`. `code` is the row's identity and is immutable after create. */
export interface CreateFactoryInput {
  code: string;
  name: string;
  timezone: string;
  description?: string;
}

/** `UpdateFactoryDto` — `code` deliberately absent, set-once. */
export interface UpdateFactoryInput {
  name?: string;
  timezone?: string;
  description?: string;
}
