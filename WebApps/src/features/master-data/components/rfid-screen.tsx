"use client";

import * as React from "react";
import { Plus, ShieldOff } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { MasterDataName } from "@/shared/components/master-data-name";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { toast } from "sonner";
import { useRevokeRfidCard, useRfidCards } from "../api/rfid-queries";
import type { RfidCard, RfidCardListFilters } from "../api/rfid-types";
import { rfidCardColumns } from "./columns";
import { RfidEnrollDialog } from "./rfid-enroll-dialog";

const PAGE_SIZE = 20;

/**
 * `RfidCard` — admin-desktop enroll/revoke (spec decision #5), independent of
 * Doc 13's mobile operator-identification flow. Revoke is terminal (decision
 * #9): no un-revoke affordance anywhere on this screen.
 */
export function RfidScreen() {
  const hasMasterView = usePermission(PERMISSIONS.MASTER_VIEW);
  const canEdit = usePermission(PERMISSIONS.MASTER_EDIT);

  const [page, setPage] = React.useState(1);
  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [revokingCard, setRevokingCard] = React.useState<RfidCard | null>(null);

  const filters: RfidCardListFilters = {
    employeeId: "",
    status: "ALL",
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isPending, isError, error, refetch } = useRfidCards(filters, hasMasterView);
  const revokeMutation = useRevokeRfidCard();

  const columns = React.useMemo<ColumnDef<RfidCard, unknown>[]>(() => {
    if (!canEdit) return rfidCardColumns;
    return [
      ...rfidCardColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === "ACTIVE" ? (
            <Button variant="ghost" size="sm" onClick={() => setRevokingCard(row.original)}>
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke
            </Button>
          ) : null,
      },
    ];
  }, [canEdit]);

  async function handleRevoke() {
    if (!revokingCard) return;
    try {
      await revokeMutation.mutateAsync(revokingCard.id);
      toast.success("RFID card revoked.");
      setRevokingCard(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setRevokingCard(null);
    }
  }

  return (
    <>
      <PageHeader
        title="RFID Card"
        description="Enroll and revoke the RFID cards employees tap to identify themselves during an exchange."
        breadcrumb={[{ label: "Master Data" }, { label: "RFID Card" }]}
        actions={
          canEdit ? (
            <Button onClick={() => setEnrollOpen(true)}>
              <Plus className="h-4 w-4" />
              Enroll Card
            </Button>
          ) : undefined
        }
      />

      <RequirePermission permission={PERMISSIONS.MASTER_VIEW} isError={isError} error={error}>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isPending}
          isError={isError}
          errorMessage={isError ? getApiErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          emptyTitle="No RFID cards found."
          emptyDescription="Enroll a card to give an employee an RFID identity."
          pageIndex={page - 1}
          pageSize={PAGE_SIZE}
          pageCount={data?.totalPages ?? 0}
          totalRows={data?.total ?? 0}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
        />
      </RequirePermission>

      {canEdit && <RfidEnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} />}

      <ConfirmDialog
        open={revokingCard !== null}
        onOpenChange={(open) => {
          if (!open) setRevokingCard(null);
        }}
        title="Revoke RFID Card"
        description="This cannot be undone — a reissued card needs a new enrollment."
        tone="destructive"
        impact={
          revokingCard
            ? [
                { label: "RFID UID", value: revokingCard.rfidUid },
                {
                  label: "Employee",
                  value: <MasterDataName collection="employees" id={revokingCard.employeeId} withCode />,
                },
              ]
            : []
        }
        confirmLabel="Revoke Card"
        onConfirm={handleRevoke}
        isConfirming={revokeMutation.isPending}
      />
    </>
  );
}
