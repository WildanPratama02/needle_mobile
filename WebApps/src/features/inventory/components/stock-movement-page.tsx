"use client";

import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useMovements } from "../api/queries";
import { useStockMovementFilters, useStockMovementFilterStore } from "../store";
import { StockMovementFilters } from "./stock-movement-filters";
import { movementColumns } from "./columns";

/**
 * `STOCK_VIEW` gates the page. `referenceType`/`referenceId` render as plain
 * columns (see `columns.tsx`) — no drill-through this batch (spec decision #9).
 */
export function StockMovementScreen() {
  const filters = useStockMovementFilters();
  const setPage = useStockMovementFilterStore((s) => s.setPage);
  const canView = usePermission(PERMISSIONS.STOCK_VIEW);
  const { data, isPending, isError, error, refetch } = useMovements(filters, canView);

  return (
    <>
      <PageHeader
        title="Stock Movement"
        description="Every stock-changing operation, traceable by reference."
        breadcrumb={[{ label: "Inventory" }, { label: "Stock Movement" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          <StockMovementFilters />

          <DataTable
            columns={movementColumns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No stock movements found."
            emptyDescription="Try a different factory, location, movement type, or date range."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          />
        </div>
      </RequirePermission>
    </>
  );
}
