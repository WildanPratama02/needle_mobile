"use client";

import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useExchangeList } from "../api/queries";
import { useExchangeFilters, useTransactionsFilterStore } from "../store";
import { ExchangeFilters } from "./exchange-filters";
import { exchangeColumns } from "./columns";

/**
 * `EXCHANGE_VIEW` gates the page. This screen used to fire the request and let
 * the server's 403 surface as a generic failure; it now checks first, like
 * every other gated screen, so an unpermitted user is told plainly and no
 * request is sent that is known to be refused.
 */
export function ExchangeTransactionsScreen() {
  const filters = useExchangeFilters();
  const setPage = useTransactionsFilterStore((s) => s.setPage);
  const canView = usePermission(PERMISSIONS.EXCHANGE_VIEW);
  const { data, isPending, isError, error, refetch } = useExchangeList(filters, canView);

  return (
    <>
      <PageHeader
        title="Exchange Transactions"
        description="Monitoring all exchange transactions within your factory scope."
        breadcrumb={[{ label: "Transactions" }, { label: "Exchange Transactions" }]}
      />

      <RequirePermission permission={PERMISSIONS.EXCHANGE_VIEW} isError={isError} error={error}>
        <div className="space-y-4">
        <ExchangeFilters />

        <DataTable
          columns={exchangeColumns}
          data={data?.items ?? []}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No exchange transactions found."
          emptyDescription="Try a different factory, trolley, or status filter."
          pageIndex={filters.page - 1}
          pageSize={filters.pageSize}
          pageCount={data?.totalPages ?? 0}
          totalRows={data?.total ?? 0}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          getRowHref={(row) => `/transactions/exchange/${row.id}`}
        />
        </div>
      </RequirePermission>
    </>
  );
}
