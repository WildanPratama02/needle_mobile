import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import type { RoleRow } from "@/core/roles";

/**
 * `.scratch/roles-permissions/spec.md` story 8: the five roles with their
 * permission counts, as an overview before drilling into one. The full
 * permission list and member names live on the detail screen
 * (`RoleDetailScreen`), not here — this table stays one row per role.
 *
 * No sortable columns: `GET /roles` returns a fixed five-row list in a
 * fixed order, there is no `sortBy` to wire.
 */
export const roleColumns: ColumnDef<RoleRow, unknown>[] = [
  {
    accessorKey: "code",
    header: "Role Code",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.code}</span>,
  },
  {
    id: "permissionCount",
    header: "Permissions",
    enableSorting: false,
    cell: ({ row }) => row.original.permissionCodes.length,
  },
  {
    accessorKey: "memberCount",
    header: "Members",
    enableSorting: false,
  },
];
