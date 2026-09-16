"use client";

import Link from "next/link";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { UserName } from "@/shared/components/user-name";
import { ADJUSTMENT_REASON_LABELS, type AdjustmentHistoryItem } from "../api/operation-history-types";
import { LocationWithType } from "./location-with-type";
import { formatDateTime } from "./relocation-columns";
import { VarianceValue } from "./variance-value";

/** Legacy adjustments (before operation headers) never recorded system/actual — shown as not recorded, never guessed. */
export function SystemToActual({ item }: { item: Pick<AdjustmentHistoryItem, "systemQuantity" | "actualQuantity"> }) {
  if (item.systemQuantity === null || item.actualQuantity === null) {
    return (
      <span className="text-slate-400" title="Not recorded for adjustments made before operation history was kept.">
        Not recorded
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap">
      {item.systemQuantity} → {item.actualQuantity}
    </span>
  );
}

/** Manual, or a link to the count session that wrote it. */
export function AdjustmentSource({ countSessionId }: { countSessionId: string | null }) {
  if (!countSessionId) return <span>Manual</span>;
  return (
    <Link
      href={`/inventory/count/${countSessionId}`}
      onClick={(event) => event.stopPropagation()}
      className="font-medium text-ocean-700 underline-offset-4 hover:underline"
    >
      Physical Count
    </Link>
  );
}

/** Adjustment history columns (ticket 02). */
export const adjustmentColumns: ColumnDef<AdjustmentHistoryItem, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    enableSorting: false,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    accessorKey: "movementNumber",
    header: "Movement No.",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs text-slate-700">{row.original.movementNumber}</span>,
  },
  {
    accessorKey: "locationId",
    header: "Location",
    enableSorting: false,
    cell: ({ row }) => <LocationWithType id={row.original.locationId} />,
  },
  {
    accessorKey: "needleTypeId",
    header: "Needle Type",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="needle-types" id={row.original.needleTypeId} withCode />,
  },
  {
    accessorKey: "reasonCode",
    header: "Reason Code",
    enableSorting: false,
    cell: ({ row }) => ADJUSTMENT_REASON_LABELS[row.original.reasonCode] ?? row.original.reasonCode,
  },
  {
    id: "systemToActual",
    header: "System → Actual",
    enableSorting: false,
    cell: ({ row }) => <SystemToActual item={row.original} />,
  },
  {
    accessorKey: "varianceQuantity",
    header: "Variance",
    enableSorting: false,
    cell: ({ row }) => <VarianceValue variance={row.original.varianceQuantity} />,
  },
  {
    id: "source",
    header: "Source",
    enableSorting: false,
    cell: ({ row }) => <AdjustmentSource countSessionId={row.original.countSessionId} />,
  },
  {
    accessorKey: "evidenceCount",
    header: "Evidence",
    enableSorting: false,
    cell: ({ row }) => row.original.evidenceCount,
  },
  {
    accessorKey: "createdBy",
    header: "Actor",
    enableSorting: false,
    cell: ({ row }) => <UserName id={row.original.createdBy} />,
  },
];
