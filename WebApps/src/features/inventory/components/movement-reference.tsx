"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { MovementItem } from "../api/types";

const REFERENCE_LABELS: Record<string, string> = {
  RECEIVING: "Receiving",
  TRANSFER: "Transfer",
  RETURN: "Stock Return",
  ADJUSTMENT: "Adjustment",
  COUNT_SESSION: "Physical Count",
};

/**
 * Spec decision 9 (`.scratch/inventory-operation-history/spec.md`, superseding
 * `.scratch/inventory/spec.md` #9): a ledger row links to the record that owns
 * it.
 *
 * - `TRANSFER` / `RETURN` → the operation header id is the movement's
 *   `referenceId`; the history screen opens its detail from `?id=`.
 * - `ADJUSTMENT` → `GET /inventory/adjustments/{id}` is keyed by the
 *   **movement** id, so the link uses the row's own `id`, not `referenceId`
 *   (which points at the adjustment header).
 * - `COUNT_SESSION` → the session route.
 *
 * Anything else (Receiving, Exchange-originated ISSUE/REVERSAL) has no detail
 * screen here and stays plain text.
 */
export function movementReferenceHref(movement: Pick<MovementItem, "id" | "referenceType" | "referenceId">): string | null {
  switch (movement.referenceType) {
    case "TRANSFER":
      return `/inventory/transfer?id=${encodeURIComponent(movement.referenceId)}`;
    case "RETURN":
      return `/inventory/return?id=${encodeURIComponent(movement.referenceId)}`;
    case "ADJUSTMENT":
      return `/inventory/adjustment?id=${encodeURIComponent(movement.id)}`;
    case "COUNT_SESSION":
      return `/inventory/count/${encodeURIComponent(movement.referenceId)}`;
    default:
      return null;
  }
}

export function MovementReference({ movement }: { movement: MovementItem }) {
  const href = movementReferenceHref(movement);
  const label = REFERENCE_LABELS[movement.referenceType] ?? movement.referenceType;

  if (!href) {
    return (
      <span className="inline-flex flex-col leading-tight">
        <span>{label}</span>
        <span className="font-mono text-xs text-slate-500">{movement.referenceId}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={movement.referenceId}
      className="inline-flex items-center gap-1 font-medium text-ocean-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}
