import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Location } from "@/core/master-data";
import type { CreateLocationInput, UpdateLocationInput } from "./location-types";

/**
 * The write half of `/locations` — reads stay in `core/master-data`
 * (`fetchMasterData("locations", ...)`). Contract: `Docs/12` "## Location",
 * implemented by `LocationController` in
 * `Backend/src/modules/master-data/controllers/master-data.controller.ts`.
 */

/** `POST /locations` — `MASTER_EDIT`, 201. 400 inactive factory / bad parent; 403 out of scope; 409 duplicate `code` within the factory. */
export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const { data } = await apiClient.post<ApiSuccessBody<Location>>("/locations", input);
  return data.data;
}

/** `PATCH /locations/:id` — `MASTER_EDIT`. 400 for TROLLEY locations or an invalid/cyclic parent; 409 when deactivating a storage location an ACTIVE mapping still targets. */
export async function updateLocation(id: string, input: UpdateLocationInput): Promise<Location> {
  const { data } = await apiClient.patch<ApiSuccessBody<Location>>(`/locations/${id}`, input);
  return data.data;
}
