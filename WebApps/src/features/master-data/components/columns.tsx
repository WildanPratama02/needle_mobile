import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import type {
  Employee,
  ExchangeType,
  Factory,
  NeedleType,
  Trolley,
} from "@/core/master-data";
import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";

/**
 * Every column here maps to a field the master-data endpoints actually return
 * (`Backend/src/modules/master-data/dto/master-data-response.dto.ts`).
 *
 * Sorting is left off. These endpoints accept no sort parameter, and letting
 * the table sort would reorder only the slice currently on screen — the same
 * trap the Exchange table documents. Rows arrive ordered by code from the
 * server.
 */

const CODE_CELL = (value: string) => <span className="font-mono text-sm">{value}</span>;

const codeColumn = <T extends { code: string }>(header: string): ColumnDef<T, unknown> => ({
  accessorKey: "code",
  header,
  enableSorting: false,
  cell: ({ row }) => CODE_CELL(row.original.code),
});

const nameColumn = <T extends { name: string }>(): ColumnDef<T, unknown> => ({
  accessorKey: "name",
  header: "Name",
  enableSorting: false,
});

const statusColumn = <T extends { status: string }>(): ColumnDef<T, unknown> => ({
  accessorKey: "status",
  header: "Status",
  enableSorting: false,
  cell: ({ row }) => <StatusBadge status={row.original.status} />,
});

const factoryColumn = <T extends { factoryId: string }>(): ColumnDef<T, unknown> => ({
  accessorKey: "factoryId",
  header: "Factory",
  enableSorting: false,
  cell: ({ row }) => <MasterDataName collection="factories" id={row.original.factoryId} />,
});

export const factoryColumns: ColumnDef<Factory, unknown>[] = [
  codeColumn("Code"),
  nameColumn(),
  {
    accessorKey: "timezone",
    header: "Timezone",
    enableSorting: false,
  },
  statusColumn(),
];

export const trolleyColumns: ColumnDef<Trolley, unknown>[] = [
  codeColumn("Code"),
  nameColumn(),
  factoryColumn(),
  statusColumn(),
];

export const needleTypeColumns: ColumnDef<NeedleType, unknown>[] = [
  codeColumn("Code"),
  nameColumn(),
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: false,
    cell: ({ row }) => row.original.category ?? <span className="text-slate-400">—</span>,
  },
  {
    accessorKey: "unit",
    header: "Unit",
    enableSorting: false,
  },
  {
    accessorKey: "minimumStock",
    header: "Minimum Stock",
    enableSorting: false,
    cell: ({ row }) => <span className="tabular-nums">{row.original.minimumStock}</span>,
  },
  statusColumn(),
];

export const exchangeTypeColumns: ColumnDef<ExchangeType, unknown>[] = [
  codeColumn("Code"),
  nameColumn(),
  {
    accessorKey: "requiresFragmentValidation",
    header: "Fragment Check",
    enableSorting: false,
    // Only BROKEN requires it, which is why some exchanges reach
    // FRAGMENT_CHECK and raise a Confirmation and others never do.
    cell: ({ row }) => (row.original.requiresFragmentValidation ? "Required" : "Not required"),
  },
  statusColumn(),
];

export const employeeColumns: ColumnDef<Employee, unknown>[] = [
  {
    accessorKey: "employeeNumber",
    header: "Employee Number",
    enableSorting: false,
    cell: ({ row }) => CODE_CELL(row.original.employeeNumber),
  },
  nameColumn(),
  {
    accessorKey: "department",
    header: "Department",
    enableSorting: false,
    cell: ({ row }) => row.original.department ?? <span className="text-slate-400">—</span>,
  },
  factoryColumn(),
  statusColumn(),
];
