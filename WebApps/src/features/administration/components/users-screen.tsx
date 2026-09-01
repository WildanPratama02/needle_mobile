"use client";

import * as React from "react";
import { KeyRound, Pencil, Plus, Power, PowerOff } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useUsersList, type UserRow } from "@/core/users";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { useUserFilters, useUserFilterStore } from "../store";
import { userColumns } from "./user-columns";
import { UserAccessDialog } from "./user-access-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { UserStatusDialog, type UserStatusTarget } from "./user-status-dialog";

/**
 * Administration → Users. Read half from `.scratch/users-read-api/spec.md`
 * (GAP-06); Create/Edit/Activate/Deactivate/Assign Role/Assign Factory Scope
 * added by ticket 06 (`.scratch/admin-panel-crud/issues/06-administration-
 * users-write-crud.md`) — all six gated on the same `USER_MANAGE` grant this
 * screen already required for reading, since `Docs/12` §16 does not split
 * Users into a separate view/edit permission the way Master Data does.
 *
 * "Assign Location Scope" and "Reset Access" are deliberately absent —
 * genuine `Docs/12` contract gaps ticket 06 carves out rather than guesses.
 */
export function UsersScreen() {
  const filters = useUserFilters();
  const setPage = useUserFilterStore((s) => s.setPage);
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const { data, isPending, isError, error, refetch } = useUsersList(filters, hasUserManage);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<UserStatusTarget | null>(null);
  const [managingUserId, setManagingUserId] = React.useState<string | null>(null);

  // Re-derived from the freshest list data on every render — never copied
  // into local state, so a role/scope toggle inside the access dialog is
  // reflected here the moment the mutation's invalidate refetches.
  const managingUser = data?.items.find((row) => row.id === managingUserId) ?? null;

  const columns = React.useMemo<ColumnDef<UserRow, unknown>[]>(() => {
    if (!hasUserManage) return userColumns;
    return [
      ...userColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingUser(row.original)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setManagingUserId(row.original.id)}>
              <KeyRound className="h-3.5 w-3.5" />
              Manage Access
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
  }, [hasUserManage]);

  return (
    <>
      <PageHeader
        title="Users"
        description="The account directory for your factories, within your scope."
        breadcrumb={[{ label: "Administration" }, { label: "Users" }]}
        actions={
          hasUserManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New User
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.USER_MANAGE} isError={isError} error={error}>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No users found."
          emptyDescription="Try a different factory."
          pageIndex={filters.page - 1}
          pageSize={filters.pageSize}
          pageCount={data?.totalPages ?? 0}
          totalRows={data?.total ?? 0}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>

      {hasUserManage && (
        <>
          <UserFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
          <UserFormDialog
            mode="edit"
            open={editingUser !== null}
            onOpenChange={(open) => {
              if (!open) setEditingUser(null);
            }}
            user={editingUser}
          />
          <UserStatusDialog
            target={statusTarget}
            open={statusTarget !== null}
            onOpenChange={(open) => {
              if (!open) setStatusTarget(null);
            }}
          />
          <UserAccessDialog
            user={managingUser}
            open={managingUserId !== null}
            onOpenChange={(open) => {
              if (!open) setManagingUserId(null);
            }}
          />
        </>
      )}
    </>
  );
}
