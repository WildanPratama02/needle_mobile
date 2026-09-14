import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Trolley } from "@/core/master-data";
import type { CreateTrolleyInput, UpdateTrolleyInput } from "./trolley-types";

/**
 * The write half of `/trolleys` — reads stay in `core/master-data`
 * (`fetchMasterData("trolleys", ...)`). `Docs/12` §9 "Trolley" documents
 * `POST`/`PATCH`, and both now exist in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`.
 */

/** `POST /trolleys` — `MASTER_EDIT`, 201. `factoryId` must reference an ACTIVE factory in the caller's scope (400 otherwise); 409 on a duplicate `code`. The backend creates the trolley's own TROLLEY location, so create carries no `locationId`. */
export async function createTrolley(input: CreateTrolleyInput): Promise<Trolley> {
  const { data } = await apiClient.post<ApiSuccessBody<Trolley>>("/trolleys", input);
  return data.data;
}

/** `PATCH /trolleys/:id` — `MASTER_EDIT`. `name`/`locationId`/`status` only; `code`/`factoryId` are immutable. */
export async function updateTrolley(id: string, input: UpdateTrolleyInput): Promise<Trolley> {
  const { data } = await apiClient.patch<ApiSuccessBody<Trolley>>(`/trolleys/${id}`, input);
  return data.data;
}
