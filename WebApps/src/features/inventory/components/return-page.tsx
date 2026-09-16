"use client";

import { RelocationHistoryScreen } from "./relocation-history-screen";

/**
 * `/inventory/return` — history-first. Stock Return is trolley → warehouse
 * only (`.scratch/inventory-operation-history` decision 2): the form's pickers
 * offer only `TROLLEY` sources and `WAREHOUSE` destinations, and the backend
 * refuses anything else with 400 regardless.
 */
export function ReturnScreen({ initialDetailId }: { initialDetailId?: string } = {}) {
  return <RelocationHistoryScreen kind="return" initialDetailId={initialDetailId} />;
}
