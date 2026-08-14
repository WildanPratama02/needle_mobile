"use client";

import { format } from "date-fns";
import { ImageOff, ImageIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { getApiErrorMessage } from "@/core/api/client";
import { useExchangeEvidence } from "../api/queries";

/** `GET /exchanges/:id/evidence` — real photos with short-lived presigned URLs. */
export function EvidenceGallery({ exchangeId }: { exchangeId: string }) {
  const { data, isLoading, isError, error, refetch } = useExchangeEvidence(exchangeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Evidence</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={ImageOff} title="No evidence uploaded yet." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {data.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- presigned MinIO URL, not a Next-optimizable static asset
                    <img src={item.url} alt={item.evidenceType} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-700">{item.evidenceType.replace("_", " ")}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-slate-400">{format(new Date(item.capturedAt), "dd MMM yyyy, HH:mm")}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
