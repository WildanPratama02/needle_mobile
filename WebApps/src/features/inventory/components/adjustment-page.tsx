"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useAdjustments } from "../api/operation-history-queries";
import {
  ADJUSTMENT_REASON_CODES,
  ADJUSTMENT_REASON_LABELS,
  type AdjustmentListFilters,
  type AdjustmentReasonCode,
} from "../api/operation-history-types";
import { useDetailParam } from "../lib/use-detail-param";
import { useAdjustmentHistoryFilterStore, useHistoryFilters } from "../store";
import { adjustmentColumns } from "./adjustment-columns";
import { AdjustmentDetailDialog } from "./adjustment-detail-dialog";
import { AdjustmentFormDialog } from "./adjustment-form-dialog";
import { HistoryFilters } from "./history-filters";

/**
 * `/inventory/adjustment` — history-first (`.scratch/inventory-operation-history`
 * decisions 1, 3, 4, 8). History needs `STOCK_VIEW`; "New Adjustment" needs
 * `STOCK_ADJUST`. Rows include the adjustments completing a count session
 * wrote (Source: Physical Count).
 */
export function AdjustmentScreen({ initialDetailId }: { initialDetailId?: string } = {}) {
  const current = useHistoryFilters(useAdjustmentHistoryFilterStore);
  const setPage = useAdjustmentHistoryFilterStore((s) => s.setPage);
  const setExtra = useAdjustmentHistoryFilterStore((s) => s.setExtra);

  const filters: AdjustmentListFilters = {
    factoryId: current.factoryId,
    locationId: current.locationId,
    needleTypeId: current.needleTypeId,
    dateFrom: current.dateFrom,
    dateTo: current.dateTo,
    reasonCode: current.extra.reasonCode,
    page: current.page,
    pageSize: current.pageSize,
  };

  const canView = usePermission(PERMISSIONS.STOCK_VIEW);
  const canAdjust = usePermission(PERMISSIONS.STOCK_ADJUST);
  const { data, isPending, isError, error, refetch } = useAdjustments(filters, canView);

  const [selectedId, selectDetail] = useDetailParam(initialDetailId);
  const [formOpen, setFormOpen] = React.useState(false);

  return (
    <>
      <PageHeader
        title="Adjustment"
        description="Corrections that set a location's balance to what is physically there — each with a reason code and evidence. Applies immediately, no approval step."
        breadcrumb={[{ label: "Inventory" }, { label: "Adjustment" }]}
        actions={
          canAdjust ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              New Adjustment
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.STOCK_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          <HistoryFilters store={useAdjustmentHistoryFilterStore} idPrefix="adjustment">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="adjustment-reason-code">
                Reason Code
              </label>
              <Select
                value={filters.reasonCode}
                onValueChange={(value) => setExtra("reasonCode", value as AdjustmentReasonCode | "ALL")}
              >
                <SelectTrigger id="adjustment-reason-code" className="w-52" aria-label="Filter by Reason Code">
                  <SelectValue placeholder="Reason Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Reason Codes</SelectItem>
                  {ADJUSTMENT_REASON_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {ADJUSTMENT_REASON_LABELS[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </HistoryFilters>

          <DataTable
            columns={adjustmentColumns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No adjustments found."
            emptyDescription="Try a different location, needle type, reason code, or date range."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
            onRowClick={(row) => selectDetail(row.id)}
            getRowLabel={(row) => `View adjustment ${row.movementNumber}`}
          />
        </div>
      </RequirePermission>

      {canAdjust && <AdjustmentFormDialog open={formOpen} onOpenChange={setFormOpen} />}

      <AdjustmentDetailDialog id={canView ? selectedId : null} onClose={() => selectDetail(null)} />
    </>
  );
}
