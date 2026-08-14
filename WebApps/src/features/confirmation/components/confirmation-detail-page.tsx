"use client";

import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/error-state";
import { getApiErrorMessage } from "@/core/api/client";
import { useConfirmation } from "../api/queries";
import { ConfirmationPanel } from "@/features/transactions/components/confirmation-panel";

/**
 * Reuses `ConfirmationPanel` from features/transactions as-is (built for the
 * Exchange Detail page) rather than a second implementation of the same
 * status/decisions/approve/reject UI — one confirmation display, two entry
 * points. This screen's own job is just resolving `confirmationId` -> the
 * `exchangeId` `ConfirmationPanel` needs, plus the page chrome around it.
 */
export function ConfirmationDetailScreen({ confirmationId }: { confirmationId: string }) {
  const { data, isLoading, isError, error, refetch } = useConfirmation(confirmationId);

  return (
    <>
      <PageHeader
        title={data?.confirmationNumber ?? "Confirmation Detail"}
        breadcrumb={[
          { label: "Transactions" },
          { label: "Confirmation", href: "/transactions/confirmation" },
          { label: data?.confirmationNumber ?? "Detail" },
        ]}
      />

      {isError ? (
        <Card>
          <CardContent className="pt-5">
            <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ConfirmationPanel exchangeId={data.exchangeId} confirmationId={confirmationId} />
      )}
    </>
  );
}
