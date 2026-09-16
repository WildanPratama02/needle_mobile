"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailField, MonoValue } from "@/shared/components/detail-field";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { MasterDataName } from "@/shared/components/master-data-name";
import { UserName } from "@/shared/components/user-name";
import { getApiErrorMessage } from "@/core/api/client";
import { useAdjustment } from "../api/operation-history-queries";
import { ADJUSTMENT_REASON_LABELS, type AdjustmentEvidence } from "../api/operation-history-types";
import { AdjustmentSource, SystemToActual } from "./adjustment-columns";
import { formatFileSize } from "./evidence-upload-field";
import { LocationWithType } from "./location-with-type";
import { formatDateTime } from "./relocation-columns";
import { VarianceValue } from "./variance-value";

function EvidenceItem({ item }: { item: AdjustmentEvidence }) {
  const isImage = item.mimeType.startsWith("image/");

  return (
    <li className="space-y-1.5">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:border-ocean-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${item.fileName}`}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned object-storage URL, not a Next-optimizable static asset
          <img src={item.url} alt={item.fileName} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-slate-400" aria-hidden="true" />
        )}
      </a>
      <p className="truncate text-xs font-medium text-slate-700" title={item.fileName}>
        {item.fileName}
      </p>
      <p className="text-xs text-slate-400">{formatFileSize(item.fileSize)}</p>
    </li>
  );
}

/** `GET /inventory/adjustments/{id}` (movement id) — every field, the note, the evidence, and the count session when one wrote it. */
export function AdjustmentDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isPending, isError, error, refetch } = useAdjustment(id);

  return (
    <Dialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjustment Detail</DialogTitle>
          <DialogDescription>{data ? data.movementNumber : "The adjustment, its quantities and its evidence."}</DialogDescription>
        </DialogHeader>

        {isError ? (
          <ErrorState
            message={getApiErrorMessage(error, "This adjustment could not be loaded. It may not exist or be outside your factory scope.")}
            onRetry={() => refetch()}
          />
        ) : isPending || !data ? (
          <div className="space-y-3" aria-label="Loading">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4">
              <DetailField label="Date" value={formatDateTime(data.createdAt)} />
              <DetailField label="Movement No." value={<MonoValue>{data.movementNumber}</MonoValue>} />
              <DetailField label="Location" value={<LocationWithType id={data.locationId} />} />
              <DetailField
                label="Needle Type"
                value={<MasterDataName collection="needle-types" id={data.needleTypeId} withCode />}
              />
              <DetailField label="Reason Code" value={ADJUSTMENT_REASON_LABELS[data.reasonCode] ?? data.reasonCode} />
              <DetailField label="Source" value={<AdjustmentSource countSessionId={data.countSessionId} />} />
              <DetailField label="System → Actual" value={<SystemToActual item={data} />} />
              <DetailField label="Variance" value={<VarianceValue variance={data.varianceQuantity} />} />
              <DetailField label="Factory" value={<MasterDataName collection="factories" id={data.factoryId} />} />
              <DetailField label="Created By" value={<UserName id={data.createdBy} />} />
              <div className="col-span-2">
                <DetailField
                  label="Note"
                  value={
                    data.reason ? (
                      <span className="whitespace-pre-wrap">{data.reason}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )
                  }
                />
              </div>
            </dl>

            <section aria-labelledby="adjustment-evidence-heading" className="space-y-2">
              <h3 id="adjustment-evidence-heading" className="text-sm font-semibold text-slate-900">
                Evidence ({data.evidence.length})
              </h3>
              {data.evidence.length > 0 ? (
                <ul className="grid grid-cols-3 gap-3">
                  {data.evidence.map((item) => (
                    <EvidenceItem key={item.id} item={item} />
                  ))}
                </ul>
              ) : data.countSessionId ? (
                <p className="text-sm text-slate-600">
                  Written by completing a count session — the session and its counted items are the evidence.{" "}
                  <Link
                    href={`/inventory/count/${data.countSessionId}`}
                    className="font-medium text-ocean-700 underline-offset-4 hover:underline"
                  >
                    Open count session
                  </Link>
                </p>
              ) : (
                <EmptyState icon={FileText} title="No evidence attached." className="py-4" />
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
