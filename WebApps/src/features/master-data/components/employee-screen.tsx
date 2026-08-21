"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { type Employee, useMasterData } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { employeeColumns } from "./columns";
import { EmployeeFormDialog } from "./employee-form-dialog";

const PAGE_SIZE = 20;

/**
 * Employee's first write path (spec decision #10) — the shared read-only
 * `MasterDataScreen` shell is deliberately not reused here (cross-cutting
 * WebApps rule: no write slots bolted onto that shell), so this screen owns
 * its own table + Create/Edit dialogs, mirroring that shell's paging
 * behaviour instead (the whole factory-scoped catalogue loads once, client-
 * side sliced — same premise the `MasterDataName` lookup layer rests on).
 */
export function EmployeeScreen() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const query = selectedFactoryId !== "all" ? { factoryId: selectedFactoryId } : {};
  const { data, isPending, isError, error, refetch } = useMasterData("employees", query, hasMasterView);

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);

  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = React.useMemo<ColumnDef<Employee, unknown>[]>(() => {
    if (!canEdit) return employeeColumns;
    return [
      ...employeeColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => setEditingEmployee(row.original)}>
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
        title="Employee"
        description="Factory-floor operators, identified by RFID during an exchange."
        breadcrumb={[{ label: "Master Data" }, { label: "Employee" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Employee
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
          emptyTitle="No employees in your scope."
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
          <EmployeeFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <EmployeeFormDialog
            mode="edit"
            open={editingEmployee !== null}
            onOpenChange={(open) => {
              if (!open) setEditingEmployee(null);
            }}
            employee={editingEmployee}
          />
        </>
      )}
    </>
  );
}
