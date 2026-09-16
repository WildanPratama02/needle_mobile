"use client";

import { RelocationHistoryScreen } from "./relocation-history-screen";

/**
 * `/inventory/transfer` — history-first (`.scratch/inventory-operation-history`
 * decision 1). Transfer stays open to any pair of distinct locations in one
 * factory (decision 2, FR-WEB-012). `initialDetailId` is the route's `?id=`,
 * so a ledger drill-through opens the detail.
 */
export function TransferScreen({ initialDetailId }: { initialDetailId?: string } = {}) {
  return <RelocationHistoryScreen kind="transfer" initialDetailId={initialDetailId} />;
}
