"use client";

import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useUsersList } from "@/core/users";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { useUserFilters, useUserFilterStore } from "../store";
import { userColumns } from "./user-columns";

/**
 * Administration → Users (`.scratch/users-read-api/spec.md`, GAP-06),
 * read-only — no create/edit/deactivate/role-reassignment here (writes and
 * Roles & Permissions are separate, un-shipped tickets; see the spec's Out
 * of Scope). Reuses the shared DataTable/PageHeader/RequirePermission
 * infrastructure, same shape as `DevicesScreen` — no new table abstraction.
 *
 * Gated on `USER_MANAGE` end to end: the nav entry, this screen's
 * `RequirePermission` wrapper, and the query's own `enabled` flag all read
 * the same grant, so a caller lacking it never issues the request and never
 * sees a 403.
 */
export function UsersScreen() {
  const filters = useUserFilters();
  const setPage = useUserFilterStore((s) => s.setPage);
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const { data, isPending, isError, error, refetch } = useUsersList(filters, hasUserManage);

  return (
    <>
      <PageHeader
        title="Users"
        description="The account directory for your factories, within your scope. Read-only."
        breadcrumb={[{ label: "Administration" }, { label: "Users" }]}
      />

      <RequirePermission permission={PERMISSIONS.USER_MANAGE} isError={isError} error={error}>
        <DataTable
          columns={userColumns}
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
    </>
  );
}
