/**
 * Physical Count / Reconciliation (ticket 05,
 * `.scratch/admin-panel-crud/issues/05-inventory-physical-count.md`,
 * FR-WEB-015). Originally confirmed against the shipped backend
 * (`Backend/src/modules/inventory/controllers/count-session.controller.ts`).
 *
 * **Operation-history update** (`.scratch/inventory-operation-history/spec.md`,
 * decision 6 and "API contract → Physical Count"): sessions can be cancelled
 * (`CANCELLED`, terminal, moves no stock); list rows gain `cancelledAt` and
 * `itemCount`; every route returning the detail gains `cancelledAt` and
 * `adjustments`. Re-verified against the shipped backend ticket 01
 * (`count-session.controller.ts`, `inventory-response.dto.ts`) now that it is
 * merged — not only against the agreed contract.
 *
 * - `POST /inventory/count-sessions`, `GET .../:id`, `POST .../:id/items` and
 *   `POST .../:id/cancel` all return a `CountSessionDetail`.
 * - `POST .../:id/complete` returns `CompleteCountSessionResult`: one
 *   ADJUSTMENT movement per non-zero variance, written atomically. 409 if a
 *   balance changed since it was counted, or the session is not `OPEN`; 400 if
 *   nothing was counted.
 * - `GET /inventory/count-sessions` is a paged list, newest first.
 * - Every route needs `STOCK_COUNT`.
 */

export const COUNT_SESSION_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"] as const;
export type CountSessionStatus = (typeof COUNT_SESSION_STATUSES)[number];

/** `CreateCountSessionDto`. */
export interface CreateCountSessionInput {
  factoryId: string;
  locationId: string;
}

interface CountSessionBase {
  id: string;
  factoryId: string;
  locationId: string;
  status: CountSessionStatus;
  /** User id of whoever opened the session — the counter. */
  createdBy: string;
  /** Set only once `COMPLETED`. */
  completedAt: string | null;
  /** Set only once `CANCELLED`. */
  cancelledAt: string | null;
  createdAt: string;
}

/** `CountSessionResponseDto` — a list row. */
export interface CountSession extends CountSessionBase {
  itemCount: number;
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

/** One ADJUSTMENT written by completing the session — `id` is the movement id `GET /inventory/adjustments/{id}` takes. */
export interface CountSessionAdjustment {
  id: string;
  movementNumber: string;
  needleTypeId: string;
  varianceQuantity: number;
}

/**
 * `CountSessionDetailResponseDto`, which `extends CountSessionResponseDto`
 * server-side — so a detail carries `itemCount` too, not only the list row.
 */
export interface CountSessionDetail extends CountSession {
  items: CountItemResult[];
  /** Empty unless `COMPLETED`. */
  adjustments: CountSessionAdjustment[];
}

/** `ListCountSessionsQueryDto`. `factoryId` is intersected with the caller's scope server-side; `pageSize` is capped at 100. */
export interface CountSessionListFilters {
  /** "all" / "" = omit. */
  factoryId: string;
  /** "" = omit. */
  locationId: string;
  status: CountSessionStatus | "ALL";
  page: number;
  pageSize: number;
}

/** `PagedCountSessionsDto` — list rows carry no `items`. */
export interface PagedCountSessions {
  items: CountSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** `CompleteCountSessionResponseDto`. */
export interface CompleteCountSessionResult {
  factoryId: string;
  session: CountSessionDetail;
  /** One ADJUSTMENT movement id per item with a non-zero variance; empty when nothing differed. */
  adjustmentMovementIds: string[];
}
