import Link from "next/link";
import { format } from "date-fns";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { StatusBadge } from "@/shared/components/status-badge";
import type { ConfirmationListItem } from "../api/types";

/**
 * Docs 18 §15 wants Exchange | Operator | Factory | Supervisor | Status.
 * `ConfirmationResponseDto` has no `operatorId` at all (confirmation doesn't
 * join the exchange's operator) — that column is omitted, same honesty rule
 * as the Exchange Transactions list. "Supervisor" = `requestedToUserId`, raw
 * id (no `/users/:id` endpoint to resolve a name from).
 *
 * No `sortBy` param exists on `GET /confirmations` either — no sortable
 * columns here, same as Exchange Transactions.
 */
export const confirmationColumns: ColumnDef<ConfirmationListItem, unknown>[] = [
  {
    accessorKey: "confirmationNumber",
    header: "Confirmation Number",
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.confirmationNumber}</span>,
  },
  {
    accessorKey: "exchangeNumber",
    header: "Exchange",
    cell: ({ row }) => (
      <Link
        href={`/transactions/exchange/${row.original.exchangeId}`}
        onClick={(event) => event.stopPropagation()}
        className="font-mono text-sm text-ocean-600 hover:underline"
      >
        {row.original.exchangeNumber}
      </Link>
    ),
  },
  {
    accessorKey: "factoryId",
    header: "Factory ID",
    cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.factoryId}</span>,
  },
  {
    accessorKey: "requestedToUserId",
    header: "Requested To",
    cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.requestedToUserId}</span>,
  },
  {
    accessorKey: "requestedAt",
    header: "Requested At",
    cell: ({ row }) => format(new Date(row.original.requestedAt), "dd MMM yyyy, HH:mm"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
