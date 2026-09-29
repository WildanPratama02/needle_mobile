"use client";

import * as React from "react";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { useMasterData, type Location, type LocationsQuery } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { locationColumns } from "./columns";
import { LocationFilters, type LocationFilterValues } from "./location-filters";
import { LocationFormDialog } from "./location-form-dialog";
import { LocationStatusDialog, type LocationStatusTarget } from "./location-status-dialog";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: LocationFilterValues = {
  factoryId: "all",
  locationType: "all",
  status: "all",
};

/**
 * Master Data → Location
 * (`.scratch/inventory-location-master-data/issues/01-location-master-data-crud.md`).
 *
 * Same shape as the Factory and Trolley screens: list, filters, create/edit
 * dialogs, activate/deactivate. Two things are specific to Location:
 *
 * 1. **A `TROLLEY` row offers no Edit.** A trolley owns its own location
 *    (ADR-003), and `PATCH /locations/{id}` refuses one with a 400 — so the
 *    row says where it is managed instead of handing a user a button that
 *    cannot work.
 * 2. **All three filters are the endpoint's own.** `GET /locations` takes
 *    `factoryId`, `status` and — since ticket 02 — `locationType`, so the type
 *    filter is a request parameter, never a pass over fetched rows. As on the
 *    Factory and Trolley screens the scoped collection is then read whole
 *    through `useMasterData` and paginated here, so the row count is the count
 *    of the filtered set the server returned.
 */
export function LocationScreen() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const [filters, setFilters] = React.useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<Location | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<LocationStatusTarget | null>(null);

  // TopBar's scope is the outer boundary; this screen's own factory filter can
  // only narrow inside it. When the scope moves, a factory picked under the
  // previous scope no longer means anything.
  const previousScope = React.useRef(selectedFactoryId);
  React.useEffect(() => {
    if (previousScope.current !== selectedFactoryId) {
      previousScope.current = selectedFactoryId;
      setFilters((current) => ({ ...current, factoryId: "all" }));
      setPage(1);
    }
  }, [selectedFactoryId]);

  const factoryId = filters.factoryId !== "all" ? filters.factoryId : selectedFactoryId !== "all" ? selectedFactoryId : undefined;

  const query: LocationsQuery = {
    ...(factoryId ? { factoryId } : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.locationType !== "all" ? { locationType: filters.locationType } : {}),
  };

  const { data, isPending, isError, error, refetch } = useMasterData("locations", query, hasMasterView);

  const rows = data ?? [];

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = React.useMemo<ColumnDef<Location, unknown>[]>(() => {
    if (!canEdit) return locationColumns;
    return [
      ...locationColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.locationType === "TROLLEY" ? (
            <span className="text-xs text-slate-500">Managed on the Trolley screen</span>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingRow(row.original)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {row.original.status === "ACTIVE" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusTarget({ row: row.original, action: "deactivate" })}
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusTarget({ row: row.original, action: "activate" })}
                >
                  <Power className="h-3.5 w-3.5" />
                  Activate
                </Button>
              )}
            </div>
          ),
      },
    ];
  }, [canEdit]);

  return (
    <>
      <PageHeader
        title="Location"
        description="Where stock can sit: warehouses and used-needle storage. A trolley's own location is created and edited on the Trolley screen."
        breadcrumb={[{ label: "Master Data" }, { label: "Location" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Location
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.MASTER_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          <LocationFilters
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />

          <DataTable
            columns={columns}
            data={visible}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No locations in your scope."
            emptyDescription="Try a different factory, type or status — or create a warehouse for this factory."
            pageIndex={safePage - 1}
            pageSize={PAGE_SIZE}
            pageCount={pageCount}
            totalRows={rows.length}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          />
        </div>
      </RequirePermission>

      {canEdit && (
        <>
          <LocationFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <LocationFormDialog
            mode="edit"
            open={editingRow !== null}
            onOpenChange={(open) => {
              if (!open) setEditingRow(null);
            }}
            location={editingRow}
          />
          <LocationStatusDialog
            target={statusTarget}
            open={statusTarget !== null}
            onOpenChange={(open) => {
              if (!open) setStatusTarget(null);
            }}
          />
        </>
      )}
    </>
  );
}
