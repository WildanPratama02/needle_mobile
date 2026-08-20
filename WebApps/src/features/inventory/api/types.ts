/**
 * Mirrors the REAL, code-verified contract in
 * `Backend/src/modules/inventory/{controllers,dto,services}` — commit
 * `0bf8988` — not `Docs/12-OpenAPI-Swagger-Specification.md` §13-14, which
 * documents 11 routes including Return and Physical Count that were
 * deliberately never built (spec decision #2, `.scratch/inventory/spec.md`).
 * Where the two disagree, the shipped code wins.
 */

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

/** `CreateTransferDto`. */
export interface CreateTransferInput {
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  note?: string;
}

/** `TransferResponseDto`. */
export interface TransferResult {
  transferId: string;
  outMovementNumber: string;
  inMovementNumber: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  sourceBalanceQuantity: number;
  destinationBalanceQuantity: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// POST /inventory/adjustments
// ---------------------------------------------------------------------------

/** `CreateAdjustmentDto` — `reason` is mandatory (`@IsNotEmpty`), `actualQuantity >= 0`. */
export interface CreateAdjustmentInput {
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  actualQuantity: number;
  reason: string;
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
  reason: string;
  createdAt: string;
}
