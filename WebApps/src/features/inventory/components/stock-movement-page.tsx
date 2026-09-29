"use client";

import Link from "next/link";

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
 * `STOCK_VIEW` gates the page. The Reference column drills through to the
 * owning Receiving / Transfer / Stock Return / Adjustment / count session
 * (`.scratch/inventory-operation-history` decision 9, see `movement-reference.tsx`).
 *
 * `referenceId` comes from the route's `?referenceId=`, not from the filter
 * store: it exists so a detail screen can link *back* to the one movement it
 * wrote (`GET /inventory/movements` filters by it). Keeping it out of the
 * store is what stops that narrowing from silently outliving the visit —
 * a later trip to the ledger from the menu shows everything again.
 */
export function StockMovementScreen({ referenceId }: { referenceId?: string } = {}) {
  const base = useStockMovementFilters();
  const filters = { ...base, referenceId: referenceId ?? "" };
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
          {referenceId && (
            <p
              className="rounded-md border border-ocean-200 bg-ocean-50 px-3 py-2 text-sm text-ocean-800"
              data-testid="reference-narrowed"
            >
              Showing only the movements of one operation.{" "}
              <Link href="/inventory/movement" className="font-medium underline underline-offset-4">
                Show all movements
              </Link>
            </p>
          )}

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
