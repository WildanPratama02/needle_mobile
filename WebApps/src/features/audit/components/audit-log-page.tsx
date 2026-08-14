"use client";

import { PageHeader } from "@/shared/components/page-header";
import { DataTable } from "@/shared/tables";
import { RequirePermission } from "@/shared/components/require-permission";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useAuditLogs } from "../api/queries";
import { useAuditFilters, useAuditFilterStore } from "../store";
import { AuditFilters } from "./audit-filters";
import { auditColumns } from "./columns";

/**
 * `AUDIT_VIEW` (MANAGEMENT/SYSTEM_ADMIN only) gates the whole page, not a
 * section of it — unlike Exchange Detail's embedded `AuditTimeline`, which
 * hides silently. `RequirePermission` supplies the Docs/18 §60 ACCESS DENIED
 * treatment and the server-403 backstop; the `enabled` flag below is what
 * stops a request known to 403 from ever being sent.
 */
export function AuditLogScreen() {
  const filters = useAuditFilters();
  const setPage = useAuditFilterStore((s) => s.setPage);
  const hasAuditView = usePermission(PERMISSIONS.AUDIT_VIEW);
  const { data, isPending, isError, error, refetch } = useAuditLogs(filters, hasAuditView);

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Read-only trail of critical actions, within your factory scope."
        breadcrumb={[{ label: "Administration" }, { label: "Audit Log" }]}
      />

      <RequirePermission permission={PERMISSIONS.AUDIT_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
          <AuditFilters />

          <DataTable
            columns={auditColumns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No audit records found."
            emptyDescription="Try a different factory, date range, or filter."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          />
        </div>
      </RequirePermission>
    </>
  );
}
