import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { NeedleType } from "@/core/master-data";
import type { CreateNeedleTypeInput, UpdateNeedleTypeInput } from "./needle-type-types";

/**
 * The write half of `/needle-types` — reads stay in `core/master-data`
 * (`fetchMasterData("needle-types", ...)`), this only adds the four routes
 * that collection never had. `Docs/12-OpenAPI-Swagger-Specification.md` §9
 * "Needle Type" documents all four, and all four now exist in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`
 * (`category` is optional on create/update).
 */

/** `POST /needle-types` — `MASTER_EDIT`, 201. 409 on a duplicate `code`. */
export async function createNeedleType(input: CreateNeedleTypeInput): Promise<NeedleType> {
  const { data } = await apiClient.post<ApiSuccessBody<NeedleType>>("/needle-types", input);
  return data.data;
}

/** `PATCH /needle-types/:id` — `MASTER_EDIT`. `name`/`description`/`category`/`unit`/`minimumStock` only; `code` is immutable. */
export async function updateNeedleType(id: string, input: UpdateNeedleTypeInput): Promise<NeedleType> {
  const { data } = await apiClient.patch<ApiSuccessBody<NeedleType>>(`/needle-types/${id}`, input);
  return data.data;
}

/** `POST /needle-types/:id/activate` — `MASTER_EDIT`. */
export async function activateNeedleType(id: string): Promise<NeedleType> {
  const { data } = await apiClient.post<ApiSuccessBody<NeedleType>>(`/needle-types/${id}/activate`, {});
  return data.data;
}

/** `POST /needle-types/:id/deactivate` — `MASTER_EDIT`. Blocks new use; never rewrites historical exchanges/movements. */
export async function deactivateNeedleType(id: string): Promise<NeedleType> {
  const { data } = await apiClient.post<ApiSuccessBody<NeedleType>>(`/needle-types/${id}/deactivate`, {});
  return data.data;
}
