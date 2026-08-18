import { format } from "date-fns";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";
import { DataTableColumnHeader } from "@/shared/tables";
import type { ExchangeListItem } from "../api/types";

/**
 * Columns limited to fields `GET /exchanges` actually returns with real
 * values. Factory and Trolley are ids on the wire and are resolved to names
 * through the master-data lookup; the remaining Docs 18 §11 columns (Operator,
 * PIC, Exchange Type, Old/New Needle Type, Confirmation Status, Sync Status)
 * still have no backing data on the list endpoint.
 *
 * `GET /exchanges` has no `sortBy` param (`ListExchangesQueryDto` doesn't
 * declare one) and is server-paginated, so every column here disables
 * sorting explicitly rather than letting DataTable's default client-sort
 * silently re-order one page of a much larger dataset.
 */
const SORT_DISABLED_REASON = "Sorting isn't available yet — GET /exchanges has no sort parameter.";

export const exchangeColumns: ColumnDef<ExchangeListItem, unknown>[] = [
  {
    accessorKey: "exchangeNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Exchange Number" sortDisabledReason={SORT_DISABLED_REASON} />
    ),
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.exchangeNumber}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" sortDisabledReason={SORT_DISABLED_REASON} />
    ),
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" sortDisabledReason={SORT_DISABLED_REASON} />
    ),
    enableSorting: false,
    cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm"),
  },
  {
    // Comes with the row rather than through a lookup — the backend projects
    // it from a relation it already loads.
    accessorKey: "exchangeTypeName",
    header: "Exchange Type",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.exchangeTypeName ?? <span className="text-slate-400">—</span>,
  },
  {
    accessorKey: "factoryId",
    header: "Factory",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="factories" id={row.original.factoryId} />,
  },
  {
    accessorKey: "trolleyId",
    header: "Trolley",
    enableSorting: false,
    cell: ({ row }) => (
      <MasterDataName collection="trolleys" id={row.original.trolleyId} withCode />
    ),
  },
];
