import { format } from "date-fns";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";
import type { Device } from "../api/device-types";

/**
 * Docs/18 §35's device table: Device ID, Device Name, Factory, Trolley, App
 * Version, Status, Last Seen — plus Serial Number (Docs/08 FR-WEB-019).
 * Sorting is left off: `GET /devices` accepts no sort parameter (spec's
 * ordering is fixed — `deviceCode` ascending, `id` tiebreaker), the same
 * "server orders, client does not re-sort a slice" rule Master Data's table
 * documents.
 */
export const deviceColumns: ColumnDef<Device, unknown>[] = [
  {
    accessorKey: "deviceCode",
    header: "Device ID",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.deviceCode}</span>,
  },
  {
    accessorKey: "deviceName",
    header: "Device Name",
    enableSorting: false,
  },
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.serialNumber}</span>,
  },
  {
    accessorKey: "factoryId",
    header: "Factory",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="factories" id={row.original.factoryId} withCode />,
  },
  {
    accessorKey: "trolleyId",
    header: "Trolley",
    enableSorting: false,
    cell: ({ row }) => <MasterDataName collection="trolleys" id={row.original.trolleyId} withCode />,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "appVersion",
    header: "App Version",
    enableSorting: false,
    cell: ({ row }) => row.original.appVersion ?? <span className="text-slate-400">—</span>,
  },
  {
    accessorKey: "lastSeenAt",
    header: "Last Seen",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.lastSeenAt ? (
        format(new Date(row.original.lastSeenAt), "dd MMM yyyy, HH:mm")
      ) : (
        <span className="text-slate-400">Never</span>
      ),
  },
];
