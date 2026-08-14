"use client";

import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/error-state";
import { getApiErrorMessage } from "@/core/api/client";
import { useExchangeDetail } from "../api/queries";
import { ExchangeSummaryCard } from "./exchange-summary-card";
import { EvidenceGallery } from "./evidence-gallery";
import { ConfirmationPanel } from "./confirmation-panel";
import { AuditTimeline } from "./audit-timeline";

export function ExchangeDetailScreen({ exchangeId }: { exchangeId: string }) {
  const { data, isLoading, isError, error, refetch } = useExchangeDetail(exchangeId);

  return (
    <>
      <PageHeader
        title={data?.exchangeNumber ?? "Exchange Detail"}
        breadcrumb={[
          { label: "Transactions" },
          { label: "Exchange Transactions", href: "/transactions/exchange" },
          { label: data?.exchangeNumber ?? "Detail" },
        ]}
      />

      {isError ? (
        <Card>
          <CardContent className="pt-5">
            <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <ExchangeSummaryCard exchange={data} />
          {data.confirmationId && <ConfirmationPanel exchangeId={exchangeId} confirmationId={data.confirmationId} />}
          <EvidenceGallery exchangeId={exchangeId} />
          <AuditTimeline exchangeId={exchangeId} />
        </div>
      )}
    </>
  );
}
