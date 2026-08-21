import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { EnrollRfidCardInput, PagedRfidCards, RfidCard, RfidCardListFilters } from "./rfid-types";

/**
 * The single seam for every `/rfid/cards` call — `rfid-queries.ts` and the
 * RFID Card screen go through here, nothing calls `apiClient` directly.
 * Verified against `Backend/src/modules/rfid/controllers/rfid.controller.ts`.
 * Deliberately not `GET /rfid/cards/{rfidUid}` — that's Doc 13's mobile
 * operator-identification lookup, a different client and flow, out of scope.
 */

export async function fetchRfidCards(filters: RfidCardListFilters): Promise<PagedRfidCards> {
  const { data } = await apiClient.get<ApiSuccessBody<RfidCard[]>>("/rfid/cards", {
    params: {
      employeeId: filters.employeeId === "" ? undefined : filters.employeeId,
      status: filters.status === "ALL" ? undefined : filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });

  return {
    items: data.data,
    page: data.meta.page ?? filters.page,
    pageSize: data.meta.pageSize ?? filters.pageSize,
    total: data.meta.total ?? 0,
    totalPages: data.meta.totalPages ?? 0,
  };
}

/** `POST /rfid/cards` — `MASTER_EDIT`, 201. A UID ACTIVE elsewhere is a 409 naming its current holder. */
export async function enrollRfidCard(input: EnrollRfidCardInput): Promise<RfidCard> {
  const { data } = await apiClient.post<ApiSuccessBody<RfidCard>>("/rfid/cards", input);
  return data.data;
}

/** `POST /rfid/cards/:id/revoke` — `MASTER_EDIT`, no body. Terminal; an already-revoked card 409s. */
export async function revokeRfidCard(id: string): Promise<RfidCard> {
  const { data } = await apiClient.post<ApiSuccessBody<RfidCard>>(`/rfid/cards/${id}/revoke`);
  return data.data;
}
