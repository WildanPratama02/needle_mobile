import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type {
  AddCountItemInput,
  CompleteCountSessionResult,
  CountSession,
  CountSessionDetail,
  CountSessionListFilters,
  CreateCountSessionInput,
  PagedCountSessions,
} from "./count-session-types";

/**
 * The `/inventory/count-sessions*` routes (ticket 05, `Docs/12` §14, plus
 * `.../cancel` from `.scratch/inventory-operation-history/spec.md`). Every
 * one behind `STOCK_COUNT`; shapes per `count-session-types.ts`.
 */

/** `GET /inventory/count-sessions` — paged, newest first. Rows carry no `items`. `status` accepts `CANCELLED`. */
export async function fetchCountSessions(filters: CountSessionListFilters): Promise<PagedCountSessions> {
  const { data } = await apiClient.get<ApiSuccessBody<CountSession[]>>("/inventory/count-sessions", {
    params: {
      factoryId: filters.factoryId === "all" || filters.factoryId === "" ? undefined : filters.factoryId,
      locationId: filters.locationId || undefined,
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

/** `POST /inventory/count-sessions` — 201, returns the new session with `items: []`. 400 on an inactive factory or a location outside it. */
export async function createCountSession(input: CreateCountSessionInput): Promise<CountSessionDetail> {
  const { data } = await apiClient.post<ApiSuccessBody<CountSessionDetail>>("/inventory/count-sessions", input);
  return data.data;
}

/** `GET /inventory/count-sessions/:id`. 404 if not found in the caller's scope. */
export async function fetchCountSession(id: string): Promise<CountSessionDetail> {
  const { data } = await apiClient.get<ApiSuccessBody<CountSessionDetail>>(`/inventory/count-sessions/${id}`);
  return data.data;
}

/** `POST /inventory/count-sessions/:id/items` — captures the current balance as `systemQuantity`; re-counting a needle type replaces its item. 409 unless `OPEN`. */
export async function addCountItem(sessionId: string, input: AddCountItemInput): Promise<CountSessionDetail> {
  const { data } = await apiClient.post<ApiSuccessBody<CountSessionDetail>>(
    `/inventory/count-sessions/${sessionId}/items`,
    input,
  );
  return data.data;
}

/**
 * `POST /inventory/count-sessions/:id/complete` — reconciles each non-zero
 * variance into an ADJUSTMENT movement, atomically. 409 if a balance changed
 * since it was counted (recount before completing) or the session is not
 * `OPEN`; 400 if nothing was counted.
 */
export async function completeCountSession(sessionId: string): Promise<CompleteCountSessionResult> {
  const { data } = await apiClient.post<ApiSuccessBody<CompleteCountSessionResult>>(
    `/inventory/count-sessions/${sessionId}/complete`,
    {},
  );
  return data.data;
}

/** `POST /inventory/count-sessions/:id/cancel` — 200 with the detail, `status: "CANCELLED"`. Moves no stock. 409 unless `OPEN`. */
export async function cancelCountSession(sessionId: string): Promise<CountSessionDetail> {
  const { data } = await apiClient.post<ApiSuccessBody<CountSessionDetail>>(
    `/inventory/count-sessions/${sessionId}/cancel`,
    {},
  );
  return data.data;
}
