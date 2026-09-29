"use client";

import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS } from "@/core/permissions";
import type { Paged } from "../api/operation-history-types";

/**
 * Just enough of a TanStack Query result for a history list to render — the
 * shell never fetches, it only displays what its caller's own hook returned.
 */
export interface OperationHistoryResult<T> {
  data?: Paged<T>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

export interface OperationHistoryScreenProps<T extends RowData> {
  title: string;
  description: string;
  /** The "New …" button, already gated on the screen's own write permission — omitted when the caller may not write. */
  action?: ReactNode;
  /** The `<HistoryFilters>` element, including whatever extra filter this screen adds. */
  filters: ReactNode;
  columns: ColumnDef<T, unknown>[];
  result: OperationHistoryResult<T>;
  /** 1-based, the same number the filters and the request carry. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription?: string;
  onRowClick: (row: T) => void;
  /** Accessible name for a row, e.g. "View receiving MV-…". */
  getRowLabel: (row: T) => string;
  /** The screen's dialogs — rendered outside the permission gate, since creating is permissioned separately from reading. */
  children?: ReactNode;
}

/**
 * The shape every history-first Inventory screen shares
 * (`.scratch/inventory-operation-history` decision 1): page header with an
 * optional "New …" action, filters, a paged `DataTable` whose row opens a
 * detail. Transfer, Stock Return and Receiving are all this component with
 * different columns, copy and queries — which is the whole reason it exists
 * rather than a third near-identical screen file
 * (`.scratch/receiving-supplier/issues/03`).
 *
 * Two gates, deliberately separate (decision 8): the history needs
 * `STOCK_VIEW`, the "New …" button needs the operation's own write permission,
 * which is why the caller builds the button and the dialogs and this shell
 * only places them. A caller with only the write grant still gets the form —
 * they just see the access-denied card where the history would be.
 */
export function OperationHistoryScreen<T extends RowData>({
  title,
  description,
  action,
  filters,
  columns,
  result,
  page,
  pageSize,
  onPageChange,
  emptyTitle,
  emptyDescription = "Try a different location, needle type, or date range.",
  onRowClick,
  getRowLabel,
  children,
}: OperationHistoryScreenProps<T>) {
  const { data, isPending, isError, error, refetch } = result;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[{ label: "Inventory" }, { label: title }]}
        actions={action}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          {filters}

          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            pageIndex={page - 1}
            pageSize={pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => onPageChange(pageIndex + 1)}
            onRowClick={onRowClick}
            getRowLabel={getRowLabel}
          />
        </div>
      </RequirePermission>

      {children}
    </>
  );
}
