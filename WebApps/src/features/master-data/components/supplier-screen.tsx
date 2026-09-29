"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { useMasterData, type Supplier } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { supplierColumns } from "./columns";
import { SupplierFormDialog } from "./supplier-form-dialog";

const PAGE_SIZE = 20;

/**
 * Supplier — writable (`.scratch/receiving-supplier` ticket 01). Business-wide
 * catalogue, no factory scope, and **no lifecycle**: unlike Needle Type,
 * Factory, Trolley and Location there is no status column, no status filter
 * and no activate/deactivate row action, because the collection has no
 * `status` to drive them (spec decision 6). Edit is the only row action, and
 * renaming is how a supplier that stops being used is corrected.
 *
 * Following the storage-mapping precedent this is a dedicated screen rather
 * than the shared read-only `MasterDataScreen` shell ("do not extend the
 * read-only shell with write slots").
 *
 * There are no filters at all here on purpose: `/suppliers` accepts `page` and
 * `pageSize` only, so the screen passes the empty query and the seam in
 * `core/master-data` drops any filter param that could reach it.
 */
export function SupplierScreen() {
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const { data, isPending, isError, error, refetch } = useMasterData("suppliers", {}, hasMasterView);

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<Supplier | null>(null);

  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = React.useMemo<ColumnDef<Supplier, unknown>[]>(() => {
    if (!canEdit) return supplierColumns;
    return [
      ...supplierColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingRow(row.original)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        ),
      },
    ];
  }, [canEdit]);

  return (
    <>
      <PageHeader
        title="Supplier"
        description="Who stock is received from. Business-wide, and never deactivated — rename instead of retiring."
        breadcrumb={[{ label: "Master Data" }, { label: "Supplier" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Supplier
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.MASTER_VIEW} isError={isError} error={error}>
        <DataTable
          columns={columns}
          data={visible}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No suppliers found."
          emptyDescription="Create one so a receiving can name where its stock came from."
          pageIndex={safePage - 1}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          totalRows={rows.length}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>

      {canEdit && (
        <>
          <SupplierFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <SupplierFormDialog
            mode="edit"
            open={editingRow !== null}
            onOpenChange={(open) => {
              if (!open) setEditingRow(null);
            }}
            supplier={editingRow}
          />
        </>
      )}
    </>
  );
}
