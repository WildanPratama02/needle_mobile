"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { useMasterData, type Trolley } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { trolleyColumns } from "./columns";
import { TrolleyFormDialog } from "./trolley-form-dialog";

const PAGE_SIZE = 20;

/**
 * Trolley — writable (ticket 03). No activate/deactivate action pair
 * (unlike Factory/Needle Type) — status changes go through the edit form's
 * `status` field, matching what `Docs/12` actually contracts.
 */
export function TrolleyScreen() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const query = selectedFactoryId !== "all" ? { factoryId: selectedFactoryId } : {};
  const { data, isPending, isError, error, refetch } = useMasterData("trolleys", query, hasMasterView);

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<Trolley | null>(null);

  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = React.useMemo<ColumnDef<Trolley, unknown>[]>(() => {
    if (!canEdit) return trolleyColumns;
    return [
      ...trolleyColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => setEditingRow(row.original)}>
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
        title="Trolley"
        description="Trolleys on the factory floor. Each is its own inventory location (ADR-003)."
        breadcrumb={[{ label: "Master Data" }, { label: "Trolley" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Trolley
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
          emptyTitle="No trolleys in your scope."
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
          <TrolleyFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <TrolleyFormDialog
            mode="edit"
            open={editingRow !== null}
            onOpenChange={(open) => {
              if (!open) setEditingRow(null);
            }}
            trolley={editingRow}
          />
        </>
      )}
    </>
  );
}
