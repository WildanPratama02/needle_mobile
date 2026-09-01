import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Trolley } from "@/core/master-data";
import type { CreateTrolleyInput, UpdateTrolleyInput } from "./trolley-types";

/**
 * The write half of `/trolleys` — reads stay in `core/master-data`
 * (`fetchMasterData("trolleys", ...)`). `Docs/12` §9 "Trolley" documents
 * `POST`/`PATCH`; ticket 03 confirms only `GET` exists in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`
 * today — `POST`/`PATCH` are backend work this WebApps-scope run does not
 * perform (see ticket status note).
 */

/** `POST /trolleys` — `MASTER_EDIT`, 201. `factoryId` must reference an ACTIVE factory in the caller's scope (400 otherwise); 409 on a duplicate `code`. */
export async function createTrolley(input: CreateTrolleyInput): Promise<Trolley> {
  const { data } = await apiClient.post<ApiSuccessBody<Trolley>>("/trolleys", input);
  return data.data;
}

/** `PATCH /trolleys/:id` — `MASTER_EDIT`. `name`/`locationId`/`status` only; `code`/`factoryId` are immutable. */
export async function updateTrolley(id: string, input: UpdateTrolleyInput): Promise<Trolley> {
  const { data } = await apiClient.patch<ApiSuccessBody<Trolley>>(`/trolleys/${id}`, input);
  return data.data;
}
