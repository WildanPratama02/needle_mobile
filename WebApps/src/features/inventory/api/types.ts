/**
 * Mirrors the REAL, code-verified contract in
 * `Backend/src/modules/inventory/{controllers,dto,services}` — commit
 * `0bf8988` — not `Docs/12-OpenAPI-Swagger-Specification.md` §13-14, which
 * historically documented 11 routes including Return and Physical Count that
 * were deliberately never built (spec decision #2, `.scratch/inventory/spec.md`).
 * Where the two disagree, the shipped code wins.
 *
 * **Ticket 04/05 update** (`.scratch/admin-panel-crud/issues/04-inventory-stock-return.md`,
 * `05-inventory-physical-count.md`, `Docs/adr/0004-admin-panel-crud-completeness.md`):
 * that "never built" decision is reopened for Return and Physical Count
 * specifically — both now have a `Docs/12` contract and an unambiguous
 * FR-WEB requirement (FR-WEB-013, FR-WEB-015), so ADR-0004 queues them as
 * "contract-ready, unbuilt" rather than "by design, out of scope." Both
 * routes have since shipped in the backend: `CreateReturnInput`/`ReturnResult`
 * below and `count-session-types.ts` are confirmed against that code —
 * flagged here rather than silently dropping the prior decision's own
 * reasoning.
 */

import type { AdjustmentReasonCode } from "./operation-history-types";

// ---------------------------------------------------------------------------
// GET /inventory/balances
// ---------------------------------------------------------------------------

/** `StockStatus` (inventory-response.dto.ts) — real values, `OUT` not `OUT_OF_STOCK`. */
export type StockStatus = "NORMAL" | "LOW" | "OUT";

/** `BalanceResponseDto` — no `id`/`factoryId`/`trolleyId` on the wire, by contract. */
export interface BalanceItem {
  locationId: string;
  needleTypeId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

/** Only the params `ListBalancesQueryDto` actually declares. */
export interface BalanceListFilters {
  /** "all" sentinel = omit — factory scope is TopBar's job, read from factory-scope-store. */
  factoryId: string;
  /** "" = omit. A real `locations` collection id. Mutually exclusive with `trolleyId` in this UI (the backend 400s if both are given and disagree). */
  locationId: string;
  /** "" = omit. A real `trolleys` collection id — resolved to its `locationId` server-side (ADR-003). */
  trolleyId: string;
  /** "" = omit. */
  needleTypeId: string;
  lowStock: boolean;
  page: number;
  pageSize: number;
}

export interface PagedBalances {
  items: BalanceItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// GET /inventory/trolleys/{trolleyId}
// ---------------------------------------------------------------------------

/** `TrolleyStockItemDto` — server-computed `stockStatus`, authoritative (unlike Stock Overview's list, see `lib/stock-status.ts`). */
export interface TrolleyStockItem {
  needleTypeId: string;
  needleTypeCode: string;
  quantity: number;
  minimumStock: number;
  stockStatus: StockStatus;
}

export interface TrolleyStock {
  trolleyId: string;
  factoryId: string;
  items: TrolleyStockItem[];
}

// ---------------------------------------------------------------------------
// GET /inventory/movements
// ---------------------------------------------------------------------------

/** `enum MovementType` (Backend/prisma/schema.prisma) — all 7 values, ISSUE/REVERSAL originate from Exchange. */
export const MOVEMENT_TYPES = [
  "RECEIVING",
  "ISSUE",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "RETURN",
  "ADJUSTMENT",
  "REVERSAL",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

/** Humanized label per type — a category, not a status, so no `StatusBadge` variant (Docs/design.md §10 doesn't map these). One map, shared by the filter Select and the table column. */
export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  RECEIVING: "Receiving",
  ISSUE: "Issue",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
  RETURN: "Return",
  ADJUSTMENT: "Adjustment",
  REVERSAL: "Reversal",
};

/** `MovementResponseDto` — no `balanceAfter` field on the wire (Docs/18 §21's ASCII table shows one; the real DTO doesn't carry it). */
export interface MovementItem {
  id: string;
  movementNumber: string;
  movementType: MovementType;
  factoryId: string;
  sourceLocationId: string | null;
  destinationLocationId: string | null;
  needleTypeId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

/** Only the params `ListMovementsQueryDto` actually declares. */
export interface MovementListFilters {
  factoryId: string;
  locationId: string;
  trolleyId: string;
  needleTypeId: string;
  movementType: MovementType | "ALL";
  /** "" = omit. `yyyy-MM-dd` — same convention Audit Log already uses for its date filters. */
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

export interface PagedMovements {
  items: MovementItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// POST /inventory/receivings
// ---------------------------------------------------------------------------

/** `CreateReceivingDto`. */
export interface CreateReceivingInput {
  factoryId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument?: string;
  note?: string;
}

/** `ReceivingResponseDto`. */
export interface ReceivingResult {
  movementId: string;
  movementNumber: string;
  factoryId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  balanceQuantity: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// POST /inventory/transfers
// ---------------------------------------------------------------------------

/** `CreateTransferDto`. `referenceDocument` (≤ 100) added by `.scratch/inventory-operation-history/spec.md` decision 5. */
export interface CreateTransferInput {
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument?: string;
  note?: string;
}

/** `TransferResponseDto`. `referenceDocument`/`note` added by the operation-history spec. */
export interface TransferResult {
  transferId: string;
  outMovementNumber: string;
  inMovementNumber: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument: string | null;
  note: string | null;
  sourceBalanceQuantity: number;
  destinationBalanceQuantity: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// POST /inventory/returns (ticket 04, FR-WEB-013)
// ---------------------------------------------------------------------------

/**
 * `CreateReturnDto` — `Docs/12-OpenAPI-Swagger-Specification.md` §13. `reason`
 * is mandatory, per the documented payload. Operation-history spec decisions
 * 2 and 5: `sourceLocationId` must be a `TROLLEY` location and
 * `destinationLocationId` a `WAREHOUSE` location (else 400); optional
 * `referenceDocument` (≤ 100).
 */
export interface CreateReturnInput {
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument?: string;
  reason: string;
}

/**
 * `ReturnResponseDto` — confirmed against the shipped backend
 * (`Backend/src/modules/inventory/dto/inventory-response.dto.ts`). A return
 * writes two `RETURN` movements atomically, an OUT from the source and an IN
 * to the destination, sharing one `returnId`; the response carries both
 * movement numbers plus both balances after the write.
 */
export interface ReturnResult {
  returnId: string;
  outMovementNumber: string;
  inMovementNumber: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument: string | null;
  reason: string;
  sourceBalanceQuantity: number;
  destinationBalanceQuantity: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// POST /inventory/adjustments
// ---------------------------------------------------------------------------

/**
 * `CreateAdjustmentDto` — operation-history spec decisions 3 and 4:
 * `reasonCode` is required; `reason` is now a note, optional except required
 * when `reasonCode` is `OTHER` (≤ 500); `evidenceIds` holds 1–5 ids uploaded by
 * the caller via `POST /inventory/adjustments/evidence` for the same factory.
 * `actualQuantity >= 0`.
 */
export interface CreateAdjustmentInput {
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  actualQuantity: number;
  reasonCode: AdjustmentReasonCode;
  reason?: string;
  evidenceIds: string[];
}

/** `AdjustmentResponseDto` — applies immediately, no pending/approval state (CONTEXT.md: Adjustment, spec decision #3). */
export interface AdjustmentResult {
  movementId: string;
  movementNumber: string;
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  systemQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  reasonCode: AdjustmentReasonCode;
  reason: string | null;
  evidenceIds: string[];
  /** Always `null` for a manual adjustment. */
  countSessionId: string | null;
  createdAt: string;
}
