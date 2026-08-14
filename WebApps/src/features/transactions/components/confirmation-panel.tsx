"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/error-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useApproveConfirmation, useConfirmation, useRejectConfirmation } from "@/features/confirmation/api/queries";
import { DetailField, MonoValue } from "./detail-field";

const DATE_FORMAT = "dd MMM yyyy, HH:mm";

/**
 * Only rendered when the exchange has a `confirmationId` (BROKEN with a
 * missing fragment) — every other exchange never raises one.
 *
 * Approve/Reject are gated on the real `permissions` from `GET /auth/me`
 * (`core/auth`) — `CONFIRMATION_APPROVE`/`CONFIRMATION_REJECT` are separate
 * grants (`shared/constants/roles.ts`: APPROVER has both, nobody else has
 * either), so hiding is per-action, not all-or-nothing. The backend still
 * enforces the real permission underneath — this is UX, not the security
 * boundary (Docs/18 §3.3/§64); a 403 still surfaces as a toast either way.
 */
export function ConfirmationPanel({ exchangeId, confirmationId }: { exchangeId: string; confirmationId: string }) {
  const { data, isLoading, isError, error, refetch } = useConfirmation(confirmationId);
  const approve = useApproveConfirmation(exchangeId, confirmationId);
  const reject = useRejectConfirmation(exchangeId, confirmationId);
  const canApprove = usePermission(PERMISSIONS.CONFIRMATION_APPROVE);
  const canReject = usePermission(PERMISSIONS.CONFIRMATION_REJECT);

  const [approveOpen, setApproveOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [approveReason, setApproveReason] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");

  async function handleApprove() {
    try {
      await approve.mutateAsync(approveReason.trim() || undefined);
      toast.success("Confirmation approved.");
      setApproveOpen(false);
      setApproveReason("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync(rejectReason.trim());
      toast.success("Confirmation rejected.");
      setRejectOpen(false);
      setRejectReason("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmation</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Confirmation Number" value={<MonoValue>{data.confirmationNumber}</MonoValue>} />
              <DetailField label="Status" value={<StatusBadge status={data.status} />} />
              <DetailField label="Requested To" value={<MonoValue>{data.requestedToUserId}</MonoValue>} />
              <DetailField label="Requested At" value={format(new Date(data.requestedAt), DATE_FORMAT)} />
              <DetailField label="Due At" value={data.dueAt ? format(new Date(data.dueAt), DATE_FORMAT) : "—"} />
              <DetailField
                label="Decided At"
                value={data.decidedAt ? format(new Date(data.decidedAt), DATE_FORMAT) : "—"}
              />
            </dl>

            {data.decisions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Decisions</p>
                <ul className="space-y-2">
                  {data.decisions.map((decision) => (
                    <li key={decision.id} className="rounded-md border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={decision.decision} />
                        <span className="text-xs text-slate-400">
                          {format(new Date(decision.decidedAt), DATE_FORMAT)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        By <MonoValue>{decision.decidedBy}</MonoValue>
                      </p>
                      {decision.reason && <p className="mt-1 text-slate-700">{decision.reason}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.status === "PENDING" && (canApprove || canReject) && (
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                {canApprove && <Button onClick={() => setApproveOpen(true)}>Approve</Button>}
                {canReject && (
                  <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Confirmation</DialogTitle>
            <DialogDescription>Releases the exchange to capture evidence.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={approveReason}
            onChange={(e) => setApproveReason(e.target.value)}
            placeholder="Optional note"
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approve.isPending}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Confirmation</DialogTitle>
            <DialogDescription>
              The exchange stops advancing until an admin cancels it. Reason is required.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection *"
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reject.isPending || rejectReason.trim() === ""}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
