"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailField } from "@/shared/components/detail-field";
import { ErrorState } from "@/shared/components/error-state";
import { MasterDataName } from "@/shared/components/master-data-name";
import { UserName } from "@/shared/components/user-name";
import { getApiErrorMessage } from "@/core/api/client";
import { useReceiving } from "../api/operation-history-queries";
import { LocationWithType } from "./location-with-type";
import { formatReceivedDate, SupplierName } from "./receiving-columns";
import { formatDateTime } from "./relocation-columns";

/**
 * The ledger drill-through in reverse: `GET /inventory/movements` filters by
 * `referenceId`, so a receiving can point back at the single movement it
 * wrote, rather than at an unfiltered ledger the reader has to search.
 */
export function LedgerMovementLink({ receivingId, movementNumber }: { receivingId: string; movementNumber: string }) {
  return (
    <Link
      href={`/inventory/movement?referenceId=${encodeURIComponent(receivingId)}`}
      className="inline-flex items-center gap-1 font-mono text-xs font-medium text-ocean-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {movementNumber}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">Open in Stock Movement</span>
    </Link>
  );
}

/** `GET /inventory/receivings/{id}` — opened from a row click or a ledger drill-through (`?id=`). */
export function ReceivingDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isPending, isError, error, refetch } = useReceiving(id);

  return (
    <Dialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receiving Detail</DialogTitle>
          <DialogDescription>
            {data ? data.movementNumber : "The receiving, who it came from, and the movement it wrote."}
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <ErrorState
            message={getApiErrorMessage(
              error,
              "This receiving could not be loaded. It may not exist or be outside your factory scope.",
            )}
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
            {/* The business day of arrival, which may be earlier than the row's own date. */}
            <DetailField label="Received Date" value={formatReceivedDate(data.receivedDate)} />
            <DetailField label="Supplier" value={<SupplierName supplierId={data.supplierId} />} />
            <DetailField label="Quantity" value={<span className="font-semibold">{data.quantity}</span>} />
            <DetailField
              label="Destination Warehouse"
              value={<LocationWithType id={data.destinationLocationId} />}
            />
            <DetailField
              label="Needle Type"
              value={<MasterDataName collection="needle-types" id={data.needleTypeId} withCode />}
            />
            <DetailField label="Factory" value={<MasterDataName collection="factories" id={data.factoryId} />} />
            <DetailField
              label="Movement No."
              value={<LedgerMovementLink receivingId={data.id} movementNumber={data.movementNumber} />}
            />
            <DetailField
              label="Reference Document"
              value={data.referenceDocument ?? <span className="text-slate-400">—</span>}
            />
            <DetailField label="Created By" value={<UserName id={data.createdBy} />} />
            <div className="col-span-2">
              <DetailField
                label="Note"
                value={
                  data.note ? (
                    <span className="whitespace-pre-wrap">{data.note}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )
                }
              />
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
