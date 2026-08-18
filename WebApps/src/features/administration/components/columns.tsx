import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";
import type { UserRow } from "@/core/users";

/**
 * `.scratch/users-read-api/spec.md`. Username, name, status and roles come
 * straight off `GET /users`; factory scope resolves through the
 * `core/master-data` factory lookup — a user's `factoryIds` are factories,
 * not users, so they go through the factories lookup, not this screen's own.
 *
 * No `sortBy` param on `GET /users` — no sortable columns, same rule as every
 * other list in this app.
 */
export const userColumns: ColumnDef<UserRow, unknown>[] = [
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.username}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) =>
      row.original.roles.length > 0 ? (
        row.original.roles.join(", ")
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  {
    accessorKey: "factoryIds",
    header: "Factory Scope",
    cell: ({ row }) =>
      row.original.factoryIds.length > 0 ? (
        <span className="space-x-1">
          {row.original.factoryIds.map((factoryId, index) => (
            <span key={factoryId}>
              {index > 0 && ", "}
              <MasterDataName collection="factories" id={factoryId} />
            </span>
          ))}
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
];
