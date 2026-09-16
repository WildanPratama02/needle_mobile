"use client";

import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { UserName } from "@/shared/components/user-name";
import type { RelocationHistoryItem, RelocationKind } from "../api/operation-history-types";
import { LocationWithType } from "./location-with-type";
import { RELOCATION_CONFIG, relocationNote } from "./relocation-config";

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

/** Transfer / Stock Return history columns (ticket 02): Date, Movement No. (out/in), From → To, Needle Type, Qty, Reference, Actor, Note|Reason. */
export function relocationColumns(kind: RelocationKind): ColumnDef<RelocationHistoryItem, unknown>[] {
  const config = RELOCATION_CONFIG[kind];

  return [
    {
      accessorKey: "createdAt",
      header: "Date",
      enableSorting: false,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: "movementNumbers",
      header: "Movement No.",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="inline-flex flex-col font-mono text-xs leading-5 text-slate-700">
          <span>
            <span className="text-slate-400">Out </span>
            {row.original.outMovementNumber}
          </span>
          <span>
            <span className="text-slate-400">In </span>
            {row.original.inMovementNumber}
          </span>
        </span>
      ),
    },
    {
      id: "route",
      header: "From → To",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <LocationWithType id={row.original.sourceLocationId} />
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="to" />
          <LocationWithType id={row.original.destinationLocationId} />
        </span>
      ),
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
    {
      id: "note",
      header: config.noteLabel,
      enableSorting: false,
      cell: ({ row }) => {
        const note = relocationNote(row.original);
        return note ? (
          <span className="line-clamp-2 max-w-xs" title={note}>
            {note}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
  ];
}
