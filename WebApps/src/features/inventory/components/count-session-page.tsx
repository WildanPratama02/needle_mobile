"use client";

import * as React from "react";
import { ClipboardCheck } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { StatusBadge, getStatusLabel } from "@/shared/components/status-badge";
import { UserName } from "@/shared/components/user-name";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useCountSessions } from "../api/count-session-queries";
import {
  COUNT_SESSION_STATUSES,
  type CountSession,
  type CountSessionListFilters,
  type CountSessionStatus,
} from "../api/count-session-types";
import { useCountSessionFilterStore, useHistoryFilters } from "../store";
import { CountSessionStartDialog } from "./count-session-start-dialog";
import { HistoryFilters } from "./history-filters";
import { LocationWithType } from "./location-with-type";
import { formatDateTime } from "./relocation-columns";

const STATUS_TABS: (CountSessionStatus | "ALL")[] = [...COUNT_SESSION_STATUSES, "ALL"];

const countSessionColumns: ColumnDef<CountSession, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    enableSorting: false,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    accessorKey: "locationId",
    header: "Location",
    enableSorting: false,
    cell: ({ row }) => <LocationWithType id={row.original.locationId} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "itemCount",
    header: "Items Counted",
    enableSorting: false,
    cell: ({ row }) => row.original.itemCount,
  },
  {
    accessorKey: "createdBy",
    header: "Counter",
    enableSorting: false,
    cell: ({ row }) => <UserName id={row.original.createdBy} />,
  },
  {
    id: "closedAt",
    header: "Completed / Cancelled",
    enableSorting: false,
    cell: ({ row }) => {
      const closedAt = row.original.completedAt ?? row.original.cancelledAt;
      return closedAt ? (
        <span className="whitespace-nowrap">{formatDateTime(closedAt)}</span>
      ) : (
        <span className="text-slate-400">—</span>
      );
    },
  },
];

/**
 * `/inventory/count` — the Physical Count landing list
 * (`.scratch/inventory-operation-history` decision 6, FR-WEB-015). Status tabs,
 * a location filter, and every session in scope; a row opens
 * `/inventory/count/[id]`, where an `OPEN` session resumes. Count-session
 * reads stay on `STOCK_COUNT` (decision 8).
 */
export function CountSessionScreen() {
  const current = useHistoryFilters(useCountSessionFilterStore);
  const setPage = useCountSessionFilterStore((s) => s.setPage);
  const setExtra = useCountSessionFilterStore((s) => s.setExtra);

  const filters: CountSessionListFilters = {
    factoryId: current.factoryId,
    locationId: current.locationId,
    status: current.extra.status,
    page: current.page,
    pageSize: current.pageSize,
  };

  const canCount = usePermission(PERMISSIONS.STOCK_COUNT);
  const { data, isPending, isError, error, refetch } = useCountSessions(filters, canCount);
  const [startOpen, setStartOpen] = React.useState(false);

  return (
    <>
      <PageHeader
        title="Physical Count"
        description="Count what is physically at a location and reconcile the difference. Resume an open count, or review what a completed one adjusted."
        breadcrumb={[{ label: "Inventory" }, { label: "Physical Count" }]}
        actions={
          canCount ? (
            <Button onClick={() => setStartOpen(true)}>
              <ClipboardCheck className="h-4 w-4" />
              Start Count
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.STOCK_COUNT} isError={isError} error={error}>
        <div className="space-y-4">
          <Tabs value={filters.status} onValueChange={(value) => setExtra("status", value as CountSessionStatus | "ALL")}>
            <TabsList aria-label="Session status">
              {STATUS_TABS.map((status) => (
                <TabsTrigger key={status} value={status}>
                  {status === "ALL" ? "All" : getStatusLabel(status)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <HistoryFilters store={useCountSessionFilterStore} idPrefix="count" showNeedleType={false} showDates={false} />

          <DataTable
            columns={countSessionColumns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle={filters.status === "OPEN" ? "No open count sessions." : "No count sessions found."}
            emptyDescription="Start a count to reconcile a location's recorded balance."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
            getRowHref={(row) => `/inventory/count/${row.id}`}
          />
        </div>
      </RequirePermission>

      {canCount && <CountSessionStartDialog open={startOpen} onOpenChange={setStartOpen} />}
    </>
  );
}
