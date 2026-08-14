"use client";

import * as React from "react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { getApiErrorMessage } from "@/core/api/client";
import { useMasterData, type MasterDataCollection, type MasterDataRowTypes } from "@/core/master-data";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";

const PAGE_SIZE = 20;

interface MasterDataScreenProps<C extends MasterDataCollection> {
  collection: C;
  title: string;
  description: string;
  columns: ColumnDef<MasterDataRowTypes[C], unknown>[];
  /** Only the four collections carrying a `factoryId` follow the header scope. */
  factoryScoped?: boolean;
  emptyTitle: string;
}

/**
 * The shell every master-data screen shares: permission gate, header, table,
 * paging. Five screens differ only in their columns and their copy, so they
 * differ only in what they pass here.
 *
 * `MASTER_VIEW` gates the whole page rather than a section, through the shared
 * `RequirePermission` wrapper — the same gate every other gated screen uses.
 * The check also feeds the query's `enabled` flag, so a request known to 403 is
 * never sent, and the server's own 403 stays as the real boundary behind it.
 *
 * Paging is client-side here, unlike the transactional screens. The lookup
 * layer already loads each catalogue whole — that is the premise the whole
 * name-resolution design rests on — so slicing what is already in memory
 * avoids a second, differently-paged copy of the same data.
 */
export function MasterDataScreen<C extends MasterDataCollection>({
  collection,
  title,
  description,
  columns,
  factoryScoped = false,
  emptyTitle,
}: MasterDataScreenProps<C>) {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);

  const query =
    factoryScoped && selectedFactoryId !== "all" ? { factoryId: selectedFactoryId } : {};

  const { data, isPending, isError, error, refetch } = useMasterData(
    collection,
    query,
    hasMasterView,
  );

  const [page, setPage] = React.useState(1);

  // A shorter result set can leave the current page past the end.
  const rows = data ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[{ label: "Master Data" }, { label: title }]}
      />

      <RequirePermission permission={PERMISSIONS.MASTER_VIEW} isError={isError} error={error}>
        <DataTable
          columns={columns}
          data={visible}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle={emptyTitle}
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
