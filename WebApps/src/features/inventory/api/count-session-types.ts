/**
 * Physical Count / Reconciliation (ticket 05,
 * `.scratch/admin-panel-crud/issues/05-inventory-physical-count.md`,
 * FR-WEB-015). Confirmed against the shipped backend:
 * `Backend/src/modules/inventory/controllers/count-session.controller.ts` and
 * `dto/inventory-{request,query,response}.dto.ts`. `Docs/12` §14 documented
 * the four request shapes but no response shapes and no list route; the
 * backend settled both, and these types mirror it.
 *
 * - `POST /inventory/count-sessions`, `GET .../:id` and `POST .../:id/items`
 *   all return a `CountSessionDetail` (a fresh session carries `items: []`).
 *   Re-counting a needle type replaces its item.
 * - `POST .../:id/complete` returns `CompleteCountSessionResult`: one
 *   ADJUSTMENT movement per non-zero variance, written atomically. 409 if a
 *   balance changed since it was counted ("recount it before completing") or
 *   the session is already completed; 400 if nothing was counted.
 * - `GET /inventory/count-sessions` is a paged list, newest first.
 */

export type CountSessionStatus = "OPEN" | "COMPLETED";

/** `CreateCountSessionDto`. */
export interface CreateCountSessionInput {
  factoryId: string;
  locationId: string;
}

/** `CountSessionResponseDto`. */
export interface CountSession {
  id: string;
  factoryId: string;
  locationId: string;
  status: CountSessionStatus;
  /** User id of whoever opened the session. */
  createdBy: string;
  /** `null` while the session is `OPEN`. */
  completedAt: string | null;
  createdAt: string;
}

/** `AddCountItemDto`. `physicalQuantity` is an integer >= 0. */
export interface AddCountItemInput {
  needleTypeId: string;
  physicalQuantity: number;
}

/** `CountItemResponseDto`. `systemQuantity` is the balance captured when the item was counted; `varianceQuantity = physical - system`. */
export interface CountItemResult {
  needleTypeId: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
}

/** `CountSessionDetailResponseDto`. */
export interface CountSessionDetail extends CountSession {
  items: CountItemResult[];
}

/** `ListCountSessionsQueryDto`. `factoryId` is intersected with the caller's scope server-side; `pageSize` is capped at 100. */
export interface CountSessionListFilters {
  factoryId?: string;
  locationId?: string;
  status?: CountSessionStatus;
  page?: number;
  pageSize?: number;
}

/** `PagedCountSessionsDto` — list rows carry no `items`. */
export interface PagedCountSessions {
  items: CountSession[];
  total: number;
  page: number;
  pageSize: number;
}

/** `CompleteCountSessionResponseDto`. */
export interface CompleteCountSessionResult {
  factoryId: string;
  session: CountSessionDetail;
  /** One ADJUSTMENT movement id per item with a non-zero variance; empty when nothing differed. */
  adjustmentMovementIds: string[];
}
