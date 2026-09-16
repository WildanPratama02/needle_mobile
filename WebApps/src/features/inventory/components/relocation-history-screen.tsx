"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useRelocations } from "../api/operation-history-queries";
import type { OperationHistoryFilters, RelocationKind } from "../api/operation-history-types";
import { useDetailParam } from "../lib/use-detail-param";
import { useHistoryFilters, useReturnHistoryFilterStore, useTransferHistoryFilterStore } from "../store";
import { HistoryFilters } from "./history-filters";
import { relocationColumns } from "./relocation-columns";
import { RELOCATION_CONFIG } from "./relocation-config";
import { RelocationDetailDialog } from "./relocation-detail-dialog";
import { RelocationFormDialog } from "./relocation-form-dialog";

/**
 * History-first Transfer / Stock Return (`.scratch/inventory-operation-history`
 * decision 1): filters + paged history; a row opens its detail; "New …" opens
 * the create form.
 *
 * Two gates, deliberately separate (decision 8): the history needs
 * `STOCK_VIEW`, the New button needs the write permission. A caller with only
 * the write grant can still create — they just see the access-denied card
 * where the history would be.
 */
export function RelocationHistoryScreen({
  kind,
  initialDetailId,
}: {
  kind: RelocationKind;
  initialDetailId?: string;
}) {
  const config = RELOCATION_CONFIG[kind];
  const store = kind === "transfer" ? useTransferHistoryFilterStore : useReturnHistoryFilterStore;
  const current = useHistoryFilters(store);
  const setPage = store((s) => s.setPage);

  const filters: OperationHistoryFilters = {
    factoryId: current.factoryId,
    locationId: current.locationId,
    needleTypeId: current.needleTypeId,
    dateFrom: current.dateFrom,
    dateTo: current.dateTo,
    page: current.page,
    pageSize: current.pageSize,
  };

  const canView = usePermission(PERMISSIONS.STOCK_VIEW);
  const canWrite = usePermission(config.writePermission);
  const { data, isPending, isError, error, refetch } = useRelocations(kind, filters, canView);

  const [selectedId, selectDetail] = useDetailParam(initialDetailId);
  const [formOpen, setFormOpen] = React.useState(false);
  const columns = React.useMemo(() => relocationColumns(kind), [kind]);

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumb={[{ label: "Inventory" }, { label: config.title }]}
        actions={
          canWrite ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {config.newLabel}
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.STOCK_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          <HistoryFilters store={store} idPrefix={kind} />

          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle={config.emptyTitle}
            emptyDescription="Try a different location, needle type, or date range."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
            onRowClick={(row) => selectDetail(row.id)}
            getRowLabel={(row) => `${config.rowNoun} ${row.outMovementNumber}`}
          />
        </div>
      </RequirePermission>

      {canWrite && <RelocationFormDialog kind={kind} open={formOpen} onOpenChange={setFormOpen} />}

      <RelocationDetailDialog kind={kind} id={canView ? selectedId : null} onClose={() => selectDetail(null)} />
    </>
  );
}
