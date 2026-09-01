"use client";

import { toast } from "sonner";

import { getApiErrorMessage } from "@/core/api/client";
import type { NeedleType } from "@/core/master-data";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useActivateNeedleType, useDeactivateNeedleType } from "../api/needle-type-queries";

export interface NeedleTypeStatusTarget {
  row: NeedleType;
  action: "activate" | "deactivate";
}

/**
 * Activate/Deactivate confirm step (ticket 01 — `Docs/18` §26 lists these as
 * explicit row actions). Deactivating blocks new use only — it never
 * rewrites historical exchanges or stock movements that already reference
 * this needle type, so the copy here says so rather than implying deletion.
 */
export function NeedleTypeStatusDialog({
  target,
  open,
  onOpenChange,
}: {
  target: NeedleTypeStatusTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const activateMutation = useActivateNeedleType();
  const deactivateMutation = useDeactivateNeedleType();
  const mutation = target?.action === "activate" ? activateMutation : deactivateMutation;

  async function handleConfirm() {
    if (!target) return;
    try {
      await mutation.mutateAsync(target.row.id);
      toast.success(target.action === "activate" ? "Needle type activated." : "Needle type deactivated.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const isActivate = target?.action === "activate";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isActivate ? "Activate Needle Type" : "Deactivate Needle Type"}
      description={
        isActivate
          ? `${target?.row.code ?? "This needle type"} becomes selectable again in receiving, transfer, and adjustment forms.`
          : `${target?.row.code ?? "This needle type"} can no longer be used in new transactions. Historical exchanges and stock movements referencing it are unaffected.`
      }
      tone={isActivate ? "impact" : "destructive"}
      confirmLabel={isActivate ? "Confirm Activation" : "Confirm Deactivation"}
      onConfirm={handleConfirm}
      isConfirming={mutation.isPending}
    />
  );
}
