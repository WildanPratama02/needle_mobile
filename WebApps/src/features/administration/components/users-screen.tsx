"use client";

import * as React from "react";

import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useUsers } from "@/core/users";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { userColumns } from "./columns";

const PAGE_SIZE = 20;

/**
 * `.scratch/users-read-api/spec.md`. `USER_MANAGE` gates the whole page,
 * through the same `RequirePermission` shell every gated screen uses, and
 * feeds `useUsers`'s `enabled` flag so a request known to 403 is never sent.
 *
 * Paging is client-side, same as `MasterDataScreen` and for the same reason:
 * the directory lookup already loads the whole caller-scoped collection into
 * memory, so slicing what is already there avoids a second, differently-paged
 * fetch of the same data.
 */
export function UsersScreen() {
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const { data, isPending, isError, error, refetch } = useUsers({}, hasUserManage);

  const [page, setPage] = React.useState(1);

  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Users"
        description="Accounts within your factory scope. Read-only."
        breadcrumb={[{ label: "Administration" }, { label: "Users" }]}
      />

      <RequirePermission permission={PERMISSIONS.USER_MANAGE} isError={isError} error={error}>
        <DataTable
          columns={userColumns}
          data={visible}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No users in your scope."
          emptyDescription="Try a different factory scope."
          pageIndex={safePage - 1}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          totalRows={rows.length}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>
    </>
  );
}
