"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useReceivings } from "../api/operation-history-queries";
import type { ReceivingListFilters } from "../api/operation-history-types";
import { useDetailParam } from "../lib/use-detail-param";
import { useHistoryFilters, useReceivingHistoryFilterStore } from "../store";
import { HistoryFilters } from "./history-filters";
import { OperationHistoryScreen } from "./operation-history-screen";
import { receivingColumns } from "./receiving-columns";
import { ReceivingDetailDialog } from "./receiving-detail-dialog";
import { ReceivingFormDialog } from "./receiving-form-dialog";

/**
 * `/inventory/receiving` — history-first, the same shape as Transfer, Stock
 * Return, Adjustment and Physical Count
 * (`.scratch/receiving-supplier/issues/03`). It could not be until ticket 02
 * gave a receiving a header row to list; before that the screen was a create
 * form with a slice of the movement ledger beside it.
 *
 * Two permissions, separately: the history needs `STOCK_VIEW`, "New Receiving"
 * needs `STOCK_RECEIVE`. `initialDetailId` is the route's `?id=`, so the
 * ledger's drill-through opens the detail.
 */
export function ReceivingScreen({ initialDetailId }: { initialDetailId?: string } = {}) {
  const current = useHistoryFilters(useReceivingHistoryFilterStore);
  const setPage = useReceivingHistoryFilterStore((s) => s.setPage);
  const setExtra = useReceivingHistoryFilterStore((s) => s.setExtra);

  const filters: ReceivingListFilters = {
    factoryId: current.factoryId,
    locationId: current.locationId,
    needleTypeId: current.needleTypeId,
    supplierId: current.extra.supplierId,
    dateFrom: current.dateFrom,
    dateTo: current.dateTo,
    page: current.page,
    pageSize: current.pageSize,
  };

  const canView = usePermission(PERMISSIONS.STOCK_VIEW);
  const canReceive = usePermission(PERMISSIONS.STOCK_RECEIVE);
  const result = useReceivings(filters, canView);

  const [selectedId, selectDetail] = useDetailParam(initialDetailId);
  const [formOpen, setFormOpen] = React.useState(false);

  return (
    <OperationHistoryScreen
      title="Receiving"
      description="Stock received from a supplier into a warehouse. To move it onward to a trolley, use Transfer."
      action={
        canReceive ? (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            New Receiving
          </Button>
        ) : undefined
      }
      filters={
        <HistoryFilters store={useReceivingHistoryFilterStore} idPrefix="receiving">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="receiving-supplier">
              Supplier
            </label>
            <MasterDataSelect
              id="receiving-supplier"
              collection="suppliers"
              value={filters.supplierId === "" ? "all" : filters.supplierId}
              onChange={(value) => setExtra("supplierId", value === "all" ? "" : value)}
              ariaLabel="Filter by Supplier"
              className="w-52"
              includeAllOption
              allLabel="All Suppliers"
            />
          </div>
        </HistoryFilters>
      }
      columns={receivingColumns}
      result={result}
      page={filters.page}
      pageSize={filters.pageSize}
      onPageChange={setPage}
      emptyTitle="No receivings found."
      emptyDescription="Try a different warehouse, supplier, needle type, or date range."
      onRowClick={(row) => selectDetail(row.id)}
      getRowLabel={(row) => `View receiving ${row.movementNumber}`}
    >
      {canReceive && <ReceivingFormDialog open={formOpen} onOpenChange={setFormOpen} />}

      <ReceivingDetailDialog id={canView ? selectedId : null} onClose={() => selectDetail(null)} />
    </OperationHistoryScreen>
  );
}
