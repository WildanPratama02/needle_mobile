import type { Location } from "@/core/master-data";
import { PERMISSIONS, type PermissionCode } from "@/core/permissions";
import type { RelocationHistoryItem, RelocationKind } from "../api/operation-history-types";

/**
 * Transfer and Stock Return are the same screen shape (two-location move, OUT
 * + IN movement pair, one header) with different copy, permission, picker
 * rules and note semantics. One config per kind rather than two copies of the
 * screen, form and detail.
 */
export interface RelocationConfig {
  title: string;
  description: string;
  newLabel: string;
  formTitle: string;
  formDescription: string;
  reviewLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  successToast: string;
  detailTitle: string;
  emptyTitle: string;
  /** Row accessible-name prefix, e.g. "View transfer". */
  rowNoun: string;
  writePermission: PermissionCode;
  /** Spec decision 2: Return offers only trolley sources and warehouse destinations. Transfer is open. */
  sourceType?: Location["locationType"];
  destinationType?: Location["locationType"];
  /** Transfer: optional `note`. Return: mandatory `reason`. */
  noteLabel: string;
  noteRequired: boolean;
  notePlaceholder: string;
}

export const RELOCATION_CONFIG: Record<RelocationKind, RelocationConfig> = {
  transfer: {
    title: "Transfer",
    description: "Stock moved between two locations in one factory — warehouse or trolley, in either direction.",
    newLabel: "New Transfer",
    formTitle: "New Transfer",
    formDescription: "Move stock between any two locations within the same factory.",
    reviewLabel: "Review Transfer",
    confirmTitle: "Confirm Transfer",
    confirmDescription: "This immediately moves stock between the two locations.",
    confirmLabel: "Confirm Transfer",
    successToast: "Transfer complete. Both balances updated.",
    detailTitle: "Transfer Detail",
    emptyTitle: "No transfers found.",
    rowNoun: "View transfer",
    writePermission: PERMISSIONS.STOCK_TRANSFER,
    noteLabel: "Note",
    noteRequired: false,
    notePlaceholder: "Optional note",
  },
  return: {
    title: "Stock Return",
    description:
      "Stock brought back from a trolley to a warehouse, with the reason recorded. To move stock any other way, use Transfer.",
    newLabel: "New Return",
    formTitle: "New Stock Return",
    formDescription: "Return stock from a trolley back to a warehouse.",
    reviewLabel: "Review Return",
    confirmTitle: "Confirm Return",
    confirmDescription: "This immediately moves stock from the trolley back to the warehouse and records the reason.",
    confirmLabel: "Confirm Return",
    successToast: "Return recorded. Both balances updated.",
    detailTitle: "Stock Return Detail",
    emptyTitle: "No stock returns found.",
    rowNoun: "View return",
    writePermission: PERMISSIONS.STOCK_RETURN,
    sourceType: "TROLLEY",
    destinationType: "WAREHOUSE",
    noteLabel: "Reason",
    noteRequired: true,
    notePlaceholder: "e.g. Excess stock after shift",
  },
};

/** Transfer rows carry `note`, Return rows `reason` — one accessor for columns and detail. */
export function relocationNote(item: RelocationHistoryItem): string | null {
  return "reason" in item ? item.reason : item.note;
}
