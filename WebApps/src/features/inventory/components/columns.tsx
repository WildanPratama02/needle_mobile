"use client";

import { format } from "date-fns";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";
import { DataTableColumnHeader } from "@/shared/tables";
import { useLookup } from "@/core/master-data";
import { computeStockStatus } from "../lib/stock-status";
import { MOVEMENT_TYPE_LABELS, type BalanceItem, type MovementItem } from "../api/types";

const SORT_DISABLED_REASON = "Sorting isn't available yet — this endpoint has no sort parameter.";

/**
 * `BalanceResponseDto` carries no `stockStatus` (see `lib/stock-status.ts`
 * for the gap this works around) — this resolves the row's needle type to
 * get `minimumStock` from the already-fetched `needle-types` lookup and bands
 * it the same way the backend does elsewhere.
 */
function BalanceStatusCell({ row }: { row: BalanceItem }) {
  const needleTypes = useLookup("needle-types");
  const needleType = needleTypes.get(row.needleTypeId);

  if (needleTypes.isLoading) {
    return <span className="text-slate-400">…</span>;
  }

  const minimumStock = needleType?.minimumStock ?? 0;
  return <StatusBadge status={computeStockStatus(row.quantity, minimumStock)} />;
}

/**
 * `BalanceResponseDto` carries no `factoryId` either — Docs/18 §19's ASCII
 * layout shows a Factory column, so this derives it by chaining through the
 * `locations` lookup (every `Location` row carries its own `factoryId`)
 * rather than adding a second network call per row.
 */
function BalanceFactoryCell({ row }: { row: BalanceItem }) {
  const locations = useLookup("locations");
  const location = locations.get(row.locationId);

  if (locations.isLoading) {
    return <span className="text-slate-400">…</span>;
  }

  return <MasterDataName collection="factories" id={location?.factoryId} />;
}

export const balanceColumns: ColumnDef<BalanceItem, unknown>[] = [
  {
    accessorKey: "needleTypeId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Needle Type" sortDisabledReason={SORT_DISABLED_REASON} />
    ),
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="needle-types" id={row.original.needleTypeId} withCode />,
  },
  {
    id: "factory",
    header: "Factory",
    enableSorting: false,
    cell: ({ row }) => <BalanceFactoryCell row={row.original} />,
  },
  {
    accessorKey: "locationId",
    header: "Location",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="locations" id={row.original.locationId} withCode />,
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" sortDisabledReason={SORT_DISABLED_REASON} />
    ),
    enableSorting: false,
    cell: ({ row }) => <span className="font-medium">{row.original.quantity}</span>,
  },
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <BalanceStatusCell row={row.original} />,
  },
];

export const movementColumns: ColumnDef<MovementItem, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" sortDisabledReason={SORT_DISABLED_REASON} />
    ),
    enableSorting: false,
    cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm"),
  },
  {
    accessorKey: "movementNumber",
    header: "Reference",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.movementNumber}</span>,
  },
  {
    accessorKey: "movementType",
    header: "Movement Type",
    enableSorting: false,
    cell: ({ row }) => MOVEMENT_TYPE_LABELS[row.original.movementType] ?? row.original.movementType,
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
    accessorKey: "sourceLocationId",
    header: "From",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="locations" id={row.original.sourceLocationId} withCode />,
  },
  {
    accessorKey: "destinationLocationId",
    header: "To",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="locations" id={row.original.destinationLocationId} withCode />,
  },
  {
    // Plain columns, deliberately not a link — spec decision #9, no drill-through this batch.
    accessorKey: "referenceType",
    header: "Reference Type",
    enableSorting: false,
    cell: ({ row }) => row.original.referenceType,
  },
  {
    accessorKey: "referenceId",
    header: "Reference ID",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.referenceId}</span>,
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    enableSorting: false,
    // No name-lookup collection maps a User id to a person (only `employees`
    // exists, a different id space) — raw id, same fallback convention
    // `ConfirmationPanel` already uses for `decidedBy`/`requestedToUserId`.
    cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.createdBy}</span>,
  },
];
