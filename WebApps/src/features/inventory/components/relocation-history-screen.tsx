"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useRelocations } from "../api/operation-history-queries";
import type { OperationHistoryFilters, RelocationKind } from "../api/operation-history-types";
import { useDetailParam } from "../lib/use-detail-param";
import { useHistoryFilters, useReturnHistoryFilterStore, useTransferHistoryFilterStore } from "../store";
import { HistoryFilters } from "./history-filters";
import { OperationHistoryScreen } from "./operation-history-screen";
import { relocationColumns } from "./relocation-columns";
import { RELOCATION_CONFIG } from "./relocation-config";
import { RelocationDetailDialog } from "./relocation-detail-dialog";
import { RelocationFormDialog } from "./relocation-form-dialog";

/**
 * History-first Transfer / Stock Return (`.scratch/inventory-operation-history`
 * decision 1). Everything structural — header, gate, filters, paged table —
 * lives in `OperationHistoryScreen`, shared with Receiving; what is left here
 * is what genuinely differs: which store, which query, which columns, which
 * copy.
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
  const result = useRelocations(kind, filters, canView);

  const [selectedId, selectDetail] = useDetailParam(initialDetailId);
  const [formOpen, setFormOpen] = React.useState(false);
  const columns = React.useMemo(() => relocationColumns(kind), [kind]);

  return (
    <OperationHistoryScreen
      title={config.title}
      description={config.description}
      action={
        canWrite ? (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {config.newLabel}
          </Button>
        ) : undefined
      }
      filters={<HistoryFilters store={store} idPrefix={kind} />}
      columns={columns}
      result={result}
      page={filters.page}
      pageSize={filters.pageSize}
      onPageChange={setPage}
      emptyTitle={config.emptyTitle}
      onRowClick={(row) => selectDetail(row.id)}
      getRowLabel={(row) => `${config.rowNoun} ${row.outMovementNumber}`}
    >
      {canWrite && <RelocationFormDialog kind={kind} open={formOpen} onOpenChange={setFormOpen} />}

      <RelocationDetailDialog kind={kind} id={canView ? selectedId : null} onClose={() => selectDetail(null)} />
    </OperationHistoryScreen>
  );
}
