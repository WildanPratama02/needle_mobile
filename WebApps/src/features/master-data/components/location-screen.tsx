"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/core/api/client";
import { LOCATION_TYPE_LABELS, useMasterData, type Location } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { locationColumns } from "./columns";
import { LocationFormDialog } from "./location-form-dialog";

const PAGE_SIZE = 20;

type TypeFilter = Location["locationType"] | "ALL";
const TYPE_FILTER_OPTIONS = Object.keys(LOCATION_TYPE_LABELS) as Location["locationType"][];

/**
 * Location — every inventory location in scope. Writable for WAREHOUSE and
 * USED_NEEDLE_STORAGE; a TROLLEY location belongs to its trolley (ADR-003)
 * and is only ever shown here, never edited — the backend refuses `PATCH` on
 * one with a 400.
 *
 * The type filter narrows client-side: `/locations` has no `locationType`
 * query param, and the collection is already loaded whole through
 * `useMasterData` (the same cache the Storage Mapping dialog reads).
 */
export function LocationScreen() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const query = selectedFactoryId !== "all" ? { factoryId: selectedFactoryId } : {};
  const { data, isPending, isError, error, refetch } = useMasterData("locations", query, hasMasterView);

  const [page, setPage] = React.useState(1);
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("ALL");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<Location | null>(null);

  const rows = React.useMemo(
    () => (typeFilter === "ALL" ? (data ?? []) : (data ?? []).filter((row) => row.locationType === typeFilter)),
    [data, typeFilter],
  );
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
            <Link href="/master-data/trolley" className="text-xs font-medium text-ocean-600 hover:underline">
              Managed via Trolleys
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingRow(row.original)}
              aria-label={`Edit ${row.original.code}`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ),
      },
    ];
  }, [canEdit]);

  return (
    <>
      <PageHeader
        title="Location"
        description="Warehouses, used-needle storage and trolley locations. Storage mappings point at a used-needle storage location."
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
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="location-type-filter">
              Type
            </label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as TypeFilter);
                setPage(1);
              }}
            >
              <SelectTrigger id="location-type-filter" className="w-56" aria-label="Filter by Type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {TYPE_FILTER_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LOCATION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={visible}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No locations in your scope."
          emptyDescription={
            typeFilter === "ALL" ? "Try a different factory scope." : "Try a different type or factory scope."
          }
          pageIndex={safePage - 1}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          totalRows={rows.length}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
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
        </>
      )}
    </>
  );
}
