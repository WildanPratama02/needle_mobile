"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useRole } from "@/core/roles";
import { useUsersByRole } from "@/core/users";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { userColumns } from "./user-columns";

/**
 * Administration → Roles & Permissions → [code] (`.scratch/roles-permissions/spec.md`
 * story 9) — one role's full permission list and its current member users,
 * by name.
 *
 * No `GET /roles/:code`: the row is read out of the same cached `GET /roles`
 * list `RolesScreen` populates (`core/roles`'s `useRole`). Members come from
 * `GET /users?role=<code>` via `core/users`'s `useUsersByRole` — the spec's
 * one new query param, not a second endpoint — reusing `userColumns` (the
 * same username/name/status/roles/factory-scope columns `UsersScreen`
 * renders) so member names resolve through the exact machinery
 * `core/users`/`core/master-data` already provide, nothing reimplemented
 * here.
 *
 * Read-only: no edit-permissions or assign-role control anywhere on this
 * screen (`Docs/adr/0003-roles-permissions-ships-read-only-first.md`).
 */
export function RoleDetailScreen({ code }: { code: string }) {
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const { data: role, isPending, isError, error, refetch } = useRole(code, hasUserManage);
  const {
    data: members,
    isPending: membersPending,
    isError: membersIsError,
    error: membersError,
    refetch: refetchMembers,
  } = useUsersByRole(code, hasUserManage);

  return (
    <>
      <PageHeader
        title={code}
        description="Permission grants and current members for this role. Read-only."
        breadcrumb={[
          { label: "Administration" },
          { label: "Roles & Permissions", href: "/administration/roles" },
          { label: code },
        ]}
      />

      <RequirePermission permission={PERMISSIONS.USER_MANAGE} isError={isError} error={error}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Granted</CardTitle>
              <CardDescription>
                {role
                  ? `${role.permissionCodes.length} permission${role.permissionCodes.length === 1 ? "" : "s"}`
                  : "What this role can do."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isError ? (
                <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
              ) : isPending ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-6 w-28" />
                  ))}
                </div>
              ) : !role ? (
                <EmptyState title="No such role." description="It may have been renamed or removed." />
              ) : role.permissionCodes.length === 0 ? (
                <EmptyState title="No permissions granted." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {role.permissionCodes.map((permission) => (
                    <Badge key={permission} variant="info">
                      {permission}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Users currently holding this role, within your factory scope.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={userColumns}
                data={members ?? []}
                isLoading={membersPending}
                isError={membersIsError}
                errorMessage={membersIsError ? getApiErrorMessage(membersError) : undefined}
                onRetry={() => refetchMembers()}
                emptyTitle="No members found."
                emptyDescription="No user in your scope currently holds this role."
                pageIndex={0}
                pageSize={Math.max(members?.length ?? 0, 1)}
                pageCount={1}
                totalRows={members?.length ?? 0}
                onPageChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </RequirePermission>
    </>
  );
}
