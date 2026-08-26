import Link from "next/link";
import { format } from "date-fns";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { UserName } from "@/shared/components/user-name";
import type { AuditLogEntry } from "../api/types";

/**
 * Docs 18 §39 lists Timestamp/Actor/Role/Action/Entity/Entity ID/Factory/
 * Device/Result as list columns, plus Before/After/Request ID/IP as "Detail"
 * fields. Real gaps, not oversights:
 *   - No "Role" or "Device" (name) field anywhere in `AuditLogResponseDto` —
 *     only `actorDeviceId` exists, and it's rarely populated (most audited
 *     actions are HTTP requests, not device-originated).
 *   - No "Result" field at all — audit rows are written for successful
 *     mutations only (`AuditLogInterceptor` runs after the handler
 *     succeeds), so there is no failure/success state to show.
 *   - No per-record detail endpoint exists (`GET /audit-logs` is list-only),
 *     so Before/After/Request ID have nowhere to live except this list —
 *     Request ID is included here since it's real and small; Before/After
 *     are large JSON blobs and `beforeData` is documented as always null
 *     (`AuditLogResponseDto`), so neither is rendered as a column.
 *
 * No `sortBy` param on `GET /audit-logs` — no sortable columns, same rule as
 * every other list in this app.
 */
export const auditColumns: ColumnDef<AuditLogEntry, unknown>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => format(new Date(row.original.timestamp), "dd MMM yyyy, HH:mm:ss"),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => row.original.action.replace(/_/g, " "),
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => {
      const { entityType, entityId } = row.original;
      if (!entityId) return entityType;

      const href =
        entityType === "Exchange"
          ? `/transactions/exchange/${entityId}`
          : entityType === "Confirmation"
            ? `/transactions/confirmation/${entityId}`
            : null;

      return (
        <span className="space-x-1">
          <span>{entityType}</span>
          {href ? (
            <Link
              href={href}
              onClick={(event) => event.stopPropagation()}
              className="font-mono text-xs text-ocean-600 hover:underline"
            >
              {entityId}
            </Link>
          ) : (
            <span className="font-mono text-xs text-slate-500">{entityId}</span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "actorUserId",
    header: "Actor",
    cell: ({ row }) =>
      row.original.actorUserId ? (
        <UserName id={row.original.actorUserId} />
      ) : (
        <span className="text-xs text-slate-400">System</span>
      ),
  },
  {
    accessorKey: "factoryId",
    header: "Factory ID",
    cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.factoryId ?? "—"}</span>,
  },
  {
    accessorKey: "requestId",
    header: "Request ID",
    cell: ({ row }) =>
      row.original.requestId ? (
        <span className="font-mono text-xs text-slate-400">{row.original.requestId}</span>
      ) : (
        "—"
      ),
  },
];
