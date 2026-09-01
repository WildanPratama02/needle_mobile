import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Factory } from "@/core/master-data";
import type { CreateFactoryInput, UpdateFactoryInput } from "./factory-types";

/**
 * The write half of `/factories` — reads stay in `core/master-data`
 * (`fetchMasterData("factories", ...)`). `Docs/12` §9 "Factory" documents all
 * four routes below; ticket 02 confirms only `GET` exists in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`
 * today — `POST`/`PATCH`/`activate`/`deactivate` are backend work this
 * WebApps-scope run does not perform (see ticket status note).
 */

/** `POST /factories` — `MASTER_EDIT`, 201. 409 on a duplicate `code`. */
export async function createFactory(input: CreateFactoryInput): Promise<Factory> {
  const { data } = await apiClient.post<ApiSuccessBody<Factory>>("/factories", input);
  return data.data;
}

/** `PATCH /factories/:id` — `MASTER_EDIT`. `name`/`timezone`/`description` only; `code` is immutable. */
export async function updateFactory(id: string, input: UpdateFactoryInput): Promise<Factory> {
  const { data } = await apiClient.patch<ApiSuccessBody<Factory>>(`/factories/${id}`, input);
  return data.data;
}

/** `POST /factories/:id/activate` — `MASTER_EDIT`. */
export async function activateFactory(id: string): Promise<Factory> {
  const { data } = await apiClient.post<ApiSuccessBody<Factory>>(`/factories/${id}/activate`, {});
  return data.data;
}

/**
 * `POST /factories/:id/deactivate` — `MASTER_EDIT`. FR-WEB-017: an inactive
 * factory must not be usable for new transactions — enforced server-side,
 * this call only flips the row's status.
 */
export async function deactivateFactory(id: string): Promise<Factory> {
  const { data } = await apiClient.post<ApiSuccessBody<Factory>>(`/factories/${id}/deactivate`, {});
  return data.data;
}
