import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type {
  AddCountItemInput,
  CompleteCountSessionResult,
  CountSession,
  CountSessionDetail,
  CreateCountSessionInput,
} from "./count-session-types";

/**
 * The four `/inventory/count-sessions*` routes (ticket 05, `Docs/12` §14).
 * None exist server-side today — `Backend/src/modules/inventory/controllers/
 * inventory.controller.ts` has no `count-sessions` route — this is backend
 * work out of this WebApps-scope run's remit (see ticket status note). Every
 * call here matches the documented request shape exactly; response shapes
 * are best-effort per `count-session-types.ts`'s header comment.
 */

/** `POST /inventory/count-sessions` — `STOCK_COUNT`. */
export async function createCountSession(input: CreateCountSessionInput): Promise<CountSession> {
  const { data } = await apiClient.post<ApiSuccessBody<CountSession>>("/inventory/count-sessions", input);
  return data.data;
}

/** `GET /inventory/count-sessions/:id` — `STOCK_COUNT`. */
export async function fetchCountSession(id: string): Promise<CountSessionDetail> {
  const { data } = await apiClient.get<ApiSuccessBody<CountSessionDetail>>(`/inventory/count-sessions/${id}`);
  return data.data;
}

/** `POST /inventory/count-sessions/:id/items` — `STOCK_COUNT`. */
export async function addCountItem(sessionId: string, input: AddCountItemInput): Promise<CountSessionDetail> {
  const { data } = await apiClient.post<ApiSuccessBody<CountSessionDetail>>(
    `/inventory/count-sessions/${sessionId}/items`,
    input,
  );
  return data.data;
}

/** `POST /inventory/count-sessions/:id/complete` — `STOCK_COUNT`. Reconciles variance into Adjustment movements. */
export async function completeCountSession(sessionId: string): Promise<CompleteCountSessionResult> {
  const { data } = await apiClient.post<ApiSuccessBody<CompleteCountSessionResult>>(
    `/inventory/count-sessions/${sessionId}/complete`,
    {},
  );
  return data.data;
}
