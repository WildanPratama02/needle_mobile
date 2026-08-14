"use client";

import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useConfirmationList } from "../api/queries";
import { useConfirmationFilters, useConfirmationFilterStore } from "../store";
import { ConfirmationStatusTabs } from "./confirmation-status-tabs";
import { confirmationColumns } from "./columns";

/**
 * `CONFIRMATION_VIEW` gates the page. Deciding a confirmation needs the
 * separate `CONFIRMATION_APPROVE`/`CONFIRMATION_REJECT` grants, which are
 * gated per-action on the detail screen — viewing the queue and acting on it
 * are different permissions and stay that way here.
 */
export function ConfirmationMonitoringScreen() {
  const filters = useConfirmationFilters();
  const setPage = useConfirmationFilterStore((s) => s.setPage);
  const canView = usePermission(PERMISSIONS.CONFIRMATION_VIEW);
  const { data, isPending, isError, error, refetch } = useConfirmationList(filters, canView);

  return (
    <>
      <PageHeader
        title="Confirmation"
        description="Broken-needle confirmations awaiting or already given a decision, within your factory scope."
        breadcrumb={[{ label: "Transactions" }, { label: "Confirmation" }]}
      />

      <RequirePermission permission={PERMISSIONS.CONFIRMATION_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
        <ConfirmationStatusTabs />

        <DataTable
          columns={confirmationColumns}
          data={data?.items ?? []}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No confirmations found."
          emptyDescription="Try a different factory or status tab."
          pageIndex={filters.page - 1}
          pageSize={filters.pageSize}
          pageCount={data?.totalPages ?? 0}
          totalRows={data?.total ?? 0}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          getRowHref={(row) => `/transactions/confirmation/${row.id}`}
        />
        </div>
      </RequirePermission>
    </>
  );
}
