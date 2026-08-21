"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { useStorageMappings } from "../api/storage-queries";
import type { StorageMapping, StorageMappingListFilters } from "../api/storage-types";
import { storageMappingColumns } from "./columns";
import { StorageMappingFormDialog } from "./storage-mapping-form-dialog";

const PAGE_SIZE = 20;

/**
 * `StorageMapping` — trolley + exchange type -> used-needle storage
 * location. Writable (spec decision #6): create assigns a new mapping,
 * edit changes only the destination (decision #2).
 */
export function StorageScreen() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingMapping, setEditingMapping] = React.useState<StorageMapping | null>(null);

  const filters: StorageMappingListFilters = {
    factoryId: selectedFactoryId,
    trolleyId: "",
    exchangeTypeId: "",
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isPending, isError, error, refetch } = useStorageMappings(filters, hasMasterView);

  const columns = React.useMemo<ColumnDef<StorageMapping, unknown>[]>(() => {
    if (!canEdit) return storageMappingColumns;
    return [
      ...storageMappingColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => setEditingMapping(row.original)}>
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
        title="Storage / Needle Hole"
        description="Where each trolley's used needles land, by exchange type."
        breadcrumb={[{ label: "Master Data" }, { label: "Storage / Needle Hole" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Mapping
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.MASTER_VIEW} isError={isError} error={error}>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No storage mappings found."
          emptyDescription="Create one to assign a trolley + exchange type its used-needle storage location."
          pageIndex={page - 1}
          pageSize={PAGE_SIZE}
          pageCount={data?.totalPages ?? 0}
          totalRows={data?.total ?? 0}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>

      {canEdit && (
        <>
          <StorageMappingFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <StorageMappingFormDialog
            mode="edit"
            open={editingMapping !== null}
            onOpenChange={(open) => {
              if (!open) setEditingMapping(null);
            }}
            mapping={editingMapping}
          />
        </>
      )}
    </>
  );
}
