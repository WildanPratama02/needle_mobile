/**
 * Physical Count / Reconciliation (ticket 05,
 * `.scratch/admin-panel-crud/issues/05-inventory-physical-count.md`,
 * FR-WEB-015). `Docs/12-OpenAPI-Swagger-Specification.md` §14 documents the
 * four request shapes below but **no response shape for any of them, and no
 * list route** — ticket 05 flags this explicitly and recommends resolving it
 * with the user before backend implementation locks a shape in. This file
 * types the documented requests exactly, and marks every response shape
 * below as a best-effort model (not a confirmed contract) so a future
 * correction is a small diff here, not a rewrite.
 *
 * Modeled on `CreateAdjustmentDto`/`AdjustmentResponseDto` per the ticket's
 * own guidance ("closest analog: location + needle-type selection, quantity
 * input, variance display, reason/evidence") — `complete` is assumed to
 * mirror `POST /inventory/adjustments`' shape for the adjustments it creates
 * (ticket 05: "`complete` computes variance per item ... and creates the
 * same kind of Adjustment the existing `POST /inventory/adjustments` path
 * creates").
 */

export type CountSessionStatus = "OPEN" | "COMPLETED";

/** `CreateCountSessionDto` — documented exactly. */
export interface CreateCountSessionInput {
  factoryId: string;
  locationId: string;
}

/** Best-effort — `Docs/12` §14 shows no response body for `POST /inventory/count-sessions`. */
export interface CountSession {
  id: string;
  factoryId: string;
  locationId: string;
  status: CountSessionStatus;
  createdAt: string;
}

/** `AddCountItemDto` — documented exactly. */
export interface AddCountItemInput {
  needleTypeId: string;
  physicalQuantity: number;
}

/** Best-effort — mirrors `AdjustmentResponseDto`'s system/actual/variance triad, applied per counted item. */
export interface CountItemResult {
  needleTypeId: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
}

/** Best-effort — `GET /inventory/count-sessions/:id`. */
export interface CountSessionDetail extends CountSession {
  items: CountItemResult[];
}

/**
 * Best-effort — `POST /inventory/count-sessions/:id/complete`. Ticket 05's
 * own open question: "what does `complete` return — the created Adjustment
 * movement(s), or just the session's final variance summary?" This type
 * carries both, so the screen degrades gracefully (renders whichever half
 * the real response actually has) until that question is answered and this
 * type is corrected against the real DTO.
 */
export interface CompleteCountSessionResult {
  session: CountSessionDetail;
  adjustmentMovementIds: string[];
}
