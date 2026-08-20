"use client";

import * as React from "react";

import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useBalances } from "../api/queries";
import { useStockOverviewFilters, useStockOverviewFilterStore } from "../store";
import { StockOverviewFilters } from "./stock-overview-filters";
import { TrolleyStockDialog } from "./trolley-stock-dialog";
import { balanceColumns } from "./columns";

/** `STOCK_VIEW` gates the page — same `RequirePermission` + `enabled` pattern every other gated screen uses. */
export function StockOverviewScreen() {
  const filters = useStockOverviewFilters();
  const setPage = useStockOverviewFilterStore((s) => s.setPage);
  const canView = usePermission(PERMISSIONS.STOCK_VIEW);
  const { data, isPending, isError, error, refetch } = useBalances(filters, canView);

  const [drillTrolleyId, setDrillTrolleyId] = React.useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="Stock Overview"
        description="Stock balances by factory, location, trolley, and needle type."
        breadcrumb={[{ label: "Inventory" }, { label: "Stock Overview" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          <StockOverviewFilters onViewTrolley={(trolleyId) => setDrillTrolleyId(trolleyId)} />

          <DataTable
            columns={balanceColumns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No stock balances found."
            emptyDescription="Try a different factory, location, trolley, or needle type filter."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          />
        </div>
      </RequirePermission>

      <TrolleyStockDialog
        trolleyId={drillTrolleyId}
        open={drillTrolleyId !== null}
        onOpenChange={(open) => {
          if (!open) setDrillTrolleyId(null);
        }}
      />
    </>
  );
}
