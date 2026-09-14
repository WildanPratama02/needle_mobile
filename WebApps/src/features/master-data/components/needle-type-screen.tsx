"use client";

import * as React from "react";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { useMasterData, type NeedleType } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { needleTypeColumns } from "./columns";
import { NeedleTypeFormDialog } from "./needle-type-form-dialog";
import { NeedleTypeStatusDialog, type NeedleTypeStatusTarget } from "./needle-type-status-dialog";

const PAGE_SIZE = 20;

/**
 * Needle Type — writable (ticket 01). Business-wide catalogue, no factory
 * scope. Following the storage-mapping precedent, this is a dedicated screen
 * rather than an extension of the shared read-only `MasterDataScreen` shell
 * ("do not extend the read-only shell with write slots").
 */
export function NeedleTypeScreen() {
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const { data, isPending, isError, error, refetch } = useMasterData("needle-types", {}, hasMasterView);

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<NeedleType | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<NeedleTypeStatusTarget | null>(null);

  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = React.useMemo<ColumnDef<NeedleType, unknown>[]>(() => {
    if (!canEdit) return needleTypeColumns;
    return [
      ...needleTypeColumns,
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
        title="Needle Type"
        description="The business-wide needle catalogue. Not specific to any factory."
        breadcrumb={[{ label: "Master Data" }, { label: "Needle Type" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Needle Type
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
          emptyTitle="No needle types found."
          emptyDescription="Create one to add it to the catalogue."
          pageIndex={safePage - 1}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          totalRows={rows.length}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>

      {canEdit && (
        <>
          <NeedleTypeFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <NeedleTypeFormDialog
            mode="edit"
            open={editingRow !== null}
            onOpenChange={(open) => {
              if (!open) setEditingRow(null);
            }}
            needleType={editingRow}
          />
          <NeedleTypeStatusDialog
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
