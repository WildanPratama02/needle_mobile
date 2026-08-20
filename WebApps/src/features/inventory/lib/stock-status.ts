import type { StockStatus } from "../api/types";

/**
 * Mirrors `InventoryService.stockStatus` (Backend/src/modules/inventory/
 * services/inventory.service.ts) and CONTEXT.md spec decision #11 exactly:
 * `OUT` at quantity 0, `LOW` at 0 < quantity <= minimumStock, else `NORMAL`.
 *
 * **Known contract gap, flagged rather than silently worked around:**
 * `GET /inventory/trolleys/{trolleyId}` returns `stockStatus`/`minimumStock`
 * per item (server-computed, authoritative), but `GET /inventory/balances`
 * (`BalanceResponseDto`) does not project either field — only
 * `quantity`/`reservedQuantity`/`availableQuantity`. Stock Overview's list
 * still needs a status per ticket 06's acceptance criteria, so this computes
 * the same published banding client-side, sourcing `minimumStock` from the
 * `needle-types` master-data collection already fetched for name resolution.
 * This is a display banding of two already-known numbers via a formula fixed
 * in CONTEXT.md, not an invented business rule — but the more correct fix is
 * for `BalanceResponseDto` to project `stockStatus`/`minimumStock` itself so
 * the frontend never re-derives it. Worth a follow-up on the backend ticket.
 */
export function computeStockStatus(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) return "OUT";
  if (quantity <= minimumStock) return "LOW";
  return "NORMAL";
}
