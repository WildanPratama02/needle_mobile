import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Supplier } from "@/core/master-data";
import type { CreateSupplierInput, UpdateSupplierInput } from "./supplier-types";

/**
 * The write half of `/suppliers` — reads stay in `core/master-data`
 * (`fetchMasterData("suppliers")`), this only adds the two routes that
 * collection has. `Docs/12-OpenAPI-Swagger-Specification.md` §9 "Supplier"
 * documents both, and both exist in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`
 * (`SupplierController`).
 *
 * **Two routes, not four.** There is no `activate`/`deactivate` pair to write
 * here: the collection has no `status` at all (spec decision 6).
 */

/** `POST /suppliers` — `MASTER_EDIT`, 201. 409 on a duplicate `code`. */
export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const { data } = await apiClient.post<ApiSuccessBody<Supplier>>("/suppliers", input);
  return data.data;
}

/** `PATCH /suppliers/:id` — `MASTER_EDIT`. `name`/`contact`/`description` only; `code` is immutable. */
export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const { data } = await apiClient.patch<ApiSuccessBody<Supplier>>(`/suppliers/${id}`, input);
  return data.data;
}
