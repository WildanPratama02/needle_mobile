"use client";

import { format, parseISO } from "date-fns";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { UserName } from "@/shared/components/user-name";
import type { ReceivingHistoryItem } from "../api/operation-history-types";
import { LocationWithType } from "./location-with-type";
import { formatDateTime } from "./relocation-columns";

/**
 * `receivedDate` is a **date**, not an instant: the leading `yyyy-MM-dd` is
 * parsed on its own, so a value the backend serialises as midnight UTC is not
 * shown as the day before in any zone behind UTC. Reading it through
 * `new Date(iso)` would do exactly that, and a backdated delivery would drift
 * by a day every time it was displayed.
 */
export function formatReceivedDate(value: string): string {
  return format(parseISO(value.slice(0, 10)), "dd MMM yyyy");
}

/**
 * Who the stock came from. `null` means the receiving predates the field
 * (`.scratch/receiving-supplier/spec.md`) — said plainly rather than left
 * blank or filled with a guess, the same treatment Adjustment gives its
 * legacy system/actual quantities.
 */
export function SupplierName({ supplierId }: { supplierId: string | null }) {
  if (!supplierId) {
    return (
      <span className="text-slate-400" title="Not recorded for receivings entered before the supplier was captured.">
        Not recorded
      </span>
    );
  }
  return <MasterDataName collection="suppliers" id={supplierId} withCode />;
}

/**
 * Receiving history columns (`.scratch/receiving-supplier/issues/03`): Date,
 * Received Date, Movement No., Supplier, Destination Warehouse, Needle Type,
 * Qty, Reference, Actor.
 *
 * Date and Received Date are both here on purpose and are not redundant: the
 * first is when the row was typed, the second the day the goods arrived, and
 * backdating is what makes them differ.
 */
export const receivingColumns: ColumnDef<ReceivingHistoryItem, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    enableSorting: false,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    accessorKey: "receivedDate",
    header: "Received Date",
    enableSorting: false,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatReceivedDate(row.original.receivedDate)}</span>,
  },
  {
    accessorKey: "movementNumber",
    header: "Movement No.",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs text-slate-700">{row.original.movementNumber}</span>,
  },
  {
    accessorKey: "supplierId",
    header: "Supplier",
    enableSorting: false,
    cell: ({ row }) => <SupplierName supplierId={row.original.supplierId} />,
  },
  {
    accessorKey: "destinationLocationId",
    header: "Destination Warehouse",
    enableSorting: false,
    cell: ({ row }) => <LocationWithType id={row.original.destinationLocationId} />,
  },
  {
    accessorKey: "needleTypeId",
    header: "Needle Type",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="needle-types" id={row.original.needleTypeId} withCode />,
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    enableSorting: false,
    cell: ({ row }) => <span className="font-medium">{row.original.quantity}</span>,
  },
  {
    accessorKey: "referenceDocument",
    header: "Reference",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.referenceDocument ? (
        <span>{row.original.referenceDocument}</span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  {
    accessorKey: "createdBy",
    header: "Actor",
    enableSorting: false,
    cell: ({ row }) => <UserName id={row.original.createdBy} />,
  },
];
