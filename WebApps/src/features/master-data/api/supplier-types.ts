/**
 * Supplier's write shapes (ticket 01,
 * `.scratch/receiving-supplier/issues/01-supplier-master-data.md`).
 * Reads already fit `core/master-data`'s `Supplier` shape — only the request
 * DTOs are new, mirroring `CreateSupplierDto`/`UpdateSupplierDto` as
 * documented in `Docs/12-OpenAPI-Swagger-Specification.md` §9 "Supplier".
 *
 * **No `EntityStatus` here, unlike every sibling file in this folder.** A
 * supplier is never deactivated (spec decision 6), so there is no activate /
 * deactivate pair, no `status` on create, and no `status` on update. The
 * absence is deliberate; the correction for a supplier that stops being used
 * is a rename, because historical receivings point at the row.
 */

/** `CreateSupplierDto`. `code` is the row's identity and is immutable after create. */
export interface CreateSupplierInput {
  code: string;
  name: string;
  /** One line — a phone number or an email. */
  contact?: string;
  description?: string;
}

/** `UpdateSupplierDto` — `code` deliberately absent, set-once (ticket 01: "code cannot change after create"). */
export interface UpdateSupplierInput {
  name?: string;
  contact?: string;
  description?: string;
}
