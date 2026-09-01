"use client";

import * as React from "react";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { useMasterData, type Factory } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { factoryColumns } from "./columns";
import { FactoryFormDialog } from "./factory-form-dialog";
import { FactoryStatusDialog, type FactoryStatusTarget } from "./factory-status-dialog";

const PAGE_SIZE = 20;

/** Factory — writable (ticket 02, FR-WEB-017). Dedicated screen, same reasoning as Needle Type. */
export function FactoryScreen() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const query = selectedFactoryId !== "all" ? { factoryId: selectedFactoryId } : {};
  const { data, isPending, isError, error, refetch } = useMasterData("factories", query, hasMasterView);

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<Factory | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<FactoryStatusTarget | null>(null);

  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = React.useMemo<ColumnDef<Factory, unknown>[]>(() => {
    if (!canEdit) return factoryColumns;
    return [
      ...factoryColumns,
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
        title="Factory"
        description="Sites you are scoped to."
        breadcrumb={[{ label: "Master Data" }, { label: "Factory" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Factory
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
          emptyTitle="No factories in your scope."
          emptyDescription="Try a different factory scope."
          pageIndex={safePage - 1}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          totalRows={rows.length}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>

      {canEdit && (
        <>
          <FactoryFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <FactoryFormDialog
            mode="edit"
            open={editingRow !== null}
            onOpenChange={(open) => {
              if (!open) setEditingRow(null);
            }}
            factory={editingRow}
          />
          <FactoryStatusDialog
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
