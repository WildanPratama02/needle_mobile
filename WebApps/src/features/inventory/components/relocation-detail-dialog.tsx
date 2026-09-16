"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailField, MonoValue } from "@/shared/components/detail-field";
import { ErrorState } from "@/shared/components/error-state";
import { MasterDataName } from "@/shared/components/master-data-name";
import { UserName } from "@/shared/components/user-name";
import { getApiErrorMessage } from "@/core/api/client";
import { useRelocation } from "../api/operation-history-queries";
import type { RelocationKind } from "../api/operation-history-types";
import { LocationWithType } from "./location-with-type";
import { formatDateTime } from "./relocation-columns";
import { RELOCATION_CONFIG, relocationNote } from "./relocation-config";

/** `GET /inventory/transfers/{id}` / `GET /inventory/returns/{id}` — opened from a row click or a ledger drill-through (`?id=`). */
export function RelocationDetailDialog({
  kind,
  id,
  onClose,
}: {
  kind: RelocationKind;
  id: string | null;
  onClose: () => void;
}) {
  const config = RELOCATION_CONFIG[kind];
  const { data, isPending, isError, error, refetch } = useRelocation(kind, id);
  const note = data ? relocationNote(data) : null;

  return (
    <Dialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{config.detailTitle}</DialogTitle>
          <DialogDescription>
            {data ? `${data.outMovementNumber} (out) · ${data.inMovementNumber} (in)` : "Operation record and its two ledger movements."}
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <ErrorState
            message={getApiErrorMessage(error, "This record could not be loaded. It may not exist or be outside your factory scope.")}
            onRetry={() => refetch()}
          />
        ) : isPending || !data ? (
          <div className="space-y-3" aria-label="Loading">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            <DetailField label="Date" value={formatDateTime(data.createdAt)} />
            <DetailField label="Quantity" value={<span className="font-semibold">{data.quantity}</span>} />
            <DetailField label="From" value={<LocationWithType id={data.sourceLocationId} />} />
            <DetailField label="To" value={<LocationWithType id={data.destinationLocationId} />} />
            <DetailField
              label="Needle Type"
              value={<MasterDataName collection="needle-types" id={data.needleTypeId} withCode />}
            />
            <DetailField label="Factory" value={<MasterDataName collection="factories" id={data.factoryId} />} />
            <DetailField label="Out Movement" value={<MonoValue>{data.outMovementNumber}</MonoValue>} />
            <DetailField label="In Movement" value={<MonoValue>{data.inMovementNumber}</MonoValue>} />
            <DetailField
              label="Reference Document"
              value={data.referenceDocument ?? <span className="text-slate-400">—</span>}
            />
            <DetailField label="Created By" value={<UserName id={data.createdBy} />} />
            <div className="col-span-2">
              <DetailField
                label={config.noteLabel}
                value={note ? <span className="whitespace-pre-wrap">{note}</span> : <span className="text-slate-400">—</span>}
              />
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
