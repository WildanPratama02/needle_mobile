import { format } from "date-fns";
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
import type { RfidCard } from "../api/rfid-types";
import type { StorageMapping } from "../api/storage-types";

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

/**
 * `StorageMapping` has no `code`/`name` — every column resolves a foreign
 * key to a name via `MasterDataName`, same as every other master-data table.
 * No Actions column here — the Storage screen appends its own, since editing
 * needs a `MASTER_EDIT` check and a click handler this static array cannot
 * carry.
 */
export const storageMappingColumns: ColumnDef<StorageMapping, unknown>[] = [
  {
    accessorKey: "trolleyId",
    header: "Trolley",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="trolleys" id={row.original.trolleyId} withCode />,
  },
  {
    accessorKey: "exchangeTypeId",
    header: "Exchange Type",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="exchange-types" id={row.original.exchangeTypeId} withCode />,
  },
  {
    accessorKey: "storageLocationId",
    header: "Storage Location",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="locations" id={row.original.storageLocationId} withCode />,
  },
  statusColumn(),
];

/**
 * `RfidCard` has no `code`/`name` either. Employee resolves against the
 * `employees` master-data collection, same lookup every other screen uses.
 * No Actions (Revoke) column here — same reasoning as `storageMappingColumns`.
 */
export const rfidCardColumns: ColumnDef<RfidCard, unknown>[] = [
  {
    accessorKey: "rfidUid",
    header: "RFID UID",
    enableSorting: false,
    cell: ({ row }) => CODE_CELL(row.original.rfidUid),
  },
  {
    accessorKey: "employeeId",
    header: "Employee",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="employees" id={row.original.employeeId} withCode />,
  },
  statusColumn(),
  {
    accessorKey: "issuedAt",
    header: "Issued Date",
    enableSorting: false,
    cell: ({ row }) => format(new Date(row.original.issuedAt), "dd MMM yyyy, HH:mm"),
  },
  {
    accessorKey: "revokedAt",
    header: "Revoked Date",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.revokedAt ? (
        format(new Date(row.original.revokedAt), "dd MMM yyyy, HH:mm")
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
];
