"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/shared/components/error-state";
import { EmptyState } from "@/shared/components/empty-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { MasterDataName } from "@/shared/components/master-data-name";
import { getApiErrorMessage } from "@/core/api/client";
import { useTrolleyStock } from "../api/queries";

/**
 * Ticket 06: "Drill-down into a trolley's per-needle-type stock via
 * `GET /inventory/trolleys/{trolleyId}`" — a modal, per the ticket's own
 * "spec leaves the exact UI mechanism to implementation." Unlike Stock
 * Overview's list, `TrolleyStockItemDto.stockStatus` is server-computed and
 * authoritative — nothing is derived client-side here.
 */
export function TrolleyStockDialog({
  trolleyId,
  open,
  onOpenChange,
}: {
  trolleyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError, error, refetch } = useTrolleyStock(trolleyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trolley Stock Detail</DialogTitle>
          <DialogDescription>
            {trolleyId ? <MasterDataName collection="trolleys" id={trolleyId} withCode /> : "Select a trolley"}
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState title="No stock recorded for this trolley." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Needle Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Minimum Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.needleTypeId}>
                  <TableCell className="font-mono text-sm">{item.needleTypeCode}</TableCell>
                  <TableCell className="font-medium">{item.quantity}</TableCell>
                  <TableCell>{item.minimumStock}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.stockStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
