import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Location } from "@/core/master-data";
import type { CreateLocationInput, UpdateLocationInput } from "./location-types";

/**
 * The write half of `/locations` — reads stay in `core/master-data`
 * (`fetchMasterData("locations", ...)`). `Docs/12` §9 "Location" documents
 * both routes below, and both now exist in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`
 * (`LocationController`).
 */

/**
 * `POST /locations` — `MASTER_EDIT`, 201. `factoryId` must reference an ACTIVE
 * factory in the caller's scope, `locationType` must not be `TROLLEY`, and a
 * `parentLocationId` must belong to the same factory (400 for each); 409 on a
 * duplicate `code` within the factory; 403 outside factory scope.
 */
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const { data } = await apiClient.post<ApiSuccessBody<Location>>("/locations", input);
  return data.data;
}

/**
 * `PATCH /locations/:id` — `MASTER_EDIT`. `name`/`parentLocationId`/`status`
 * only; `code` and `locationType` are immutable, and a `TROLLEY` row is
 * refused with a 400 (it is managed through its trolley).
 */
export async function updateLocation(id: string, input: UpdateLocationInput): Promise<Location> {
  const { data } = await apiClient.patch<ApiSuccessBody<Location>>(`/locations/${id}`, input);
  return data.data;
}
