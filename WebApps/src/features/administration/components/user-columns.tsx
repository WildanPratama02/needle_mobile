import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";
import type { UserRow } from "@/core/users";

/**
 * `.scratch/users-read-api/spec.md`'s Implementation Decisions: username,
 * name, status, roles (comma-joined codes), and factory scope resolved
 * through the *master-data* factory lookup — a user's `factoryIds` resolve
 * through `core/master-data`, not `core/users`, because factories are not
 * users.
 *
 * No sortable columns: `UserQueryDto` accepts no `sortBy` param — ordering is
 * fixed server-side (username ascending, id tiebreaker), same rule every
 * other list in this app follows.
 */
export const userColumns: ColumnDef<UserRow, unknown>[] = [
  {
    accessorKey: "username",
    header: "Username",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.username}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "roles",
    header: "Roles",
    enableSorting: false,
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
    enableSorting: false,
    cell: ({ row }) =>
      row.original.factoryIds.length > 0 ? (
        <span className="flex flex-wrap gap-1">
          {row.original.factoryIds.map((factoryId) => (
            <MasterDataName key={factoryId} collection="factories" id={factoryId} />
          ))}
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
];
