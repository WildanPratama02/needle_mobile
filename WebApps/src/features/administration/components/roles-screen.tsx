"use client";

import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useRoles } from "@/core/roles";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { PermissionCatalogueCard } from "./permission-catalogue-card";
import { roleColumns } from "./role-columns";

/**
 * Administration → Roles & Permissions (`.scratch/roles-permissions/spec.md`),
 * read-only — no create/edit/assign control anywhere on this screen (role
 * and permission mutation is deferred per `Docs/adr/0003-roles-permissions-
 * ships-read-only-first.md`, story 10). Reuses the shared
 * DataTable/PageHeader/RequirePermission infrastructure, same shape as
 * `UsersScreen`/`DevicesScreen` — no new table abstraction.
 *
 * Gated on `USER_MANAGE` end to end, matching `nav-config.ts`'s existing
 * placeholder gate for this entry (story 6/11): the nav entry, this
 * screen's `RequirePermission` wrapper, and the query's own `enabled` flag
 * all read the same grant, so a caller lacking it never issues the request.
 *
 * Five rows, no filters, no real pagination need (spec's Implementation
 * Decisions) — `DataTable` still renders its pager for layout consistency
 * with every other list screen, but both Prev/Next stay disabled at
 * `pageCount={1}`.
 */
export function RolesScreen() {
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const { data, isPending, isError, error, refetch } = useRoles(hasUserManage);

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="The role catalogue, what each role grants, and how many users hold it. Read-only."
        breadcrumb={[{ label: "Administration" }, { label: "Roles & Permissions" }]}
      />

      <RequirePermission permission={PERMISSIONS.USER_MANAGE} isError={isError} error={error}>
        <div className="space-y-4">
          <DataTable
            columns={roleColumns}
            data={data ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No roles found."
            pageIndex={0}
            pageSize={Math.max(data?.length ?? 0, 1)}
            pageCount={1}
            totalRows={data?.length ?? 0}
            onPageChange={() => {}}
            getRowHref={(row) => `/administration/roles/${row.code}`}
          />

          <PermissionCatalogueCard enabled={hasUserManage} />
        </div>
      </RequirePermission>
    </>
  );
}
