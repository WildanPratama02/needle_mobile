import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Confirmation, ConfirmationListFilters, ConfirmationListItem, PagedConfirmations } from "./types";

/** `GET /confirmations` — confirmation.controller.ts:56, `CONFIRMATION_VIEW`. */
export async function fetchConfirmations(filters: ConfirmationListFilters): Promise<PagedConfirmations> {
  const { data } = await apiClient.get<ApiSuccessBody<ConfirmationListItem[]>>("/confirmations", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
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

/** `GET /confirmations/:id` — confirmation.controller.ts:78, `CONFIRMATION_VIEW`. */
export async function fetchConfirmation(confirmationId: string): Promise<Confirmation> {
  const { data } = await apiClient.get<ApiSuccessBody<Confirmation>>(`/confirmations/${confirmationId}`);
  return data.data;
}

/** `POST /confirmations/:id/approve` — `CONFIRMATION_APPROVE`. `reason` is optional on approval. */
export async function approveConfirmation(confirmationId: string, reason?: string): Promise<Confirmation> {
  const { data } = await apiClient.post<ApiSuccessBody<Confirmation>>(`/confirmations/${confirmationId}/approve`, {
    reason,
  });
  return data.data;
}

/** `POST /confirmations/:id/reject` — `CONFIRMATION_REJECT`. `reason` is mandatory (backend 400s without it). */
export async function rejectConfirmation(confirmationId: string, reason: string): Promise<Confirmation> {
  const { data } = await apiClient.post<ApiSuccessBody<Confirmation>>(`/confirmations/${confirmationId}/reject`, {
    reason,
  });
  return data.data;
}
