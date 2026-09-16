/**
 * Operation history — Transfer, Stock Return, Adjustment
 * (`.scratch/inventory-operation-history/spec.md`, "API contract").
 *
 * **Verified against the shipped backend** — `inventory-history.controller.ts`
 * and `inventory-response.dto.ts` from ticket 01, now merged — as well as
 * `Docs/12` §13–14. Where the two could disagree, the contract doc gets fixed
 * first and these types follow; they are in agreement today.
 *
 * One id worth stating plainly, because two plausible readings exist: an
 * adjustment's `id` is the **ADJUSTMENT movement id**, not a separate header
 * id. `stock_adjustments.id` is the movement's own id (schema:
 * `movement StockMovement @relation(fields: [id], references: [id])`), which
 * is what makes the ledger's drill-through land on the right record.
 *
 * Every list is paged (`pageSize` ≤ 100), newest first, intersected with the
 * caller's factory scope server-side, and needs `STOCK_VIEW` (spec decision 8).
 */

// ---------------------------------------------------------------------------
// Shared list plumbing
// ---------------------------------------------------------------------------

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** The filters every operation-history list shares. Same sentinels as the movement ledger: `factoryId` "all" = omit, "" = omit. */
export interface OperationHistoryFilters {
  factoryId: string;
  /** Transfer/Return: matches source **or** destination. Adjustment: the adjusted location. */
  locationId: string;
  needleTypeId: string;
  /** `yyyy-MM-dd` from a date input — widened to an inclusive local-day ISO bound at the data-source seam. */
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Transfer / Stock Return — `StockRelocationResponse`
// ---------------------------------------------------------------------------

export type RelocationKind = "transfer" | "return";

interface StockRelocationBase {
  /** The operation header id (`transferId` / `returnId` on the create response). */
  id: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument: string | null;
  outMovementNumber: string;
  inMovementNumber: string;
  createdBy: string;
  createdAt: string;
}

/** `GET /inventory/transfers` row and `GET /inventory/transfers/{transferId}`. */
export interface TransferHistoryItem extends StockRelocationBase {
  note: string | null;
}

/** `GET /inventory/returns` row and `GET /inventory/returns/{returnId}` — `reason` in place of `note`. */
export interface ReturnHistoryItem extends StockRelocationBase {
  reason: string;
}

export type RelocationHistoryItem = TransferHistoryItem | ReturnHistoryItem;

// ---------------------------------------------------------------------------
// Adjustment
// ---------------------------------------------------------------------------

/** `Docs/02` §13 — spec decision 3. Count-session adjustments are always `PHYSICAL_COUNT`. */
export const ADJUSTMENT_REASON_CODES = ["PHYSICAL_COUNT", "DAMAGED", "LOST", "DATA_CORRECTION", "OTHER"] as const;
export type AdjustmentReasonCode = (typeof ADJUSTMENT_REASON_CODES)[number];

/** A category, not a status — no `StatusBadge` variant. One label map for the filter, the form, the table and the detail. */
export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReasonCode, string> = {
  PHYSICAL_COUNT: "Physical Count",
  DAMAGED: "Damaged",
  LOST: "Lost",
  DATA_CORRECTION: "Data Correction",
  OTHER: "Other",
};

export interface AdjustmentListFilters extends OperationHistoryFilters {
  reasonCode: AdjustmentReasonCode | "ALL";
}

/** `AdjustmentHistoryResponse` — `id` is the ADJUSTMENT movement id. */
export interface AdjustmentHistoryItem {
  id: string;
  movementNumber: string;
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  reasonCode: AdjustmentReasonCode;
  /** The note. Required only when `reasonCode` is `OTHER`. */
  reason: string | null;
  /** `null` only for adjustments made before operation headers existed (not recoverable). */
  systemQuantity: number | null;
  actualQuantity: number | null;
  /** Signed: `actual - system`. */
  varianceQuantity: number;
  /** Set when the adjustment was written by completing a count session. */
  countSessionId: string | null;
  evidenceCount: number;
  createdBy: string;
  createdAt: string;
}

/** One attached file; `url` is presigned and short-lived (15 min) — never cached beyond the query. */
export interface AdjustmentEvidence {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

/** `GET /inventory/adjustments/{id}`. */
export interface AdjustmentDetail extends AdjustmentHistoryItem {
  evidence: AdjustmentEvidence[];
}

/** `POST /inventory/adjustments/evidence` — `201`. Stored, but owned by no adjustment until one claims its id. */
export interface UploadedEvidence {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

/** Evidence upload limits from the contract — the client checks them first so a bad file never costs a round trip. */
export const EVIDENCE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const EVIDENCE_MAX_FILES = 5;
