"use client";

import { toast } from "sonner";

import { getApiErrorMessage } from "@/core/api/client";
import type { Factory } from "@/core/master-data";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useActivateFactory, useDeactivateFactory } from "../api/factory-queries";

export interface FactoryStatusTarget {
  row: Factory;
  action: "activate" | "deactivate";
}

/**
 * Activate/Deactivate (ticket 02, FR-WEB-017). Deactivating a factory does
 * not cascade to its trolleys/locations/devices — those stay independently
 * managed, matching how Employee deactivation doesn't touch a factory and
 * Device revoke doesn't touch a trolley. The rule that an inactive factory
 * cannot be used for new transactions is enforced server-side, not here.
 */
export function FactoryStatusDialog({
  target,
  open,
  onOpenChange,
}: {
  target: FactoryStatusTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const activateMutation = useActivateFactory();
  const deactivateMutation = useDeactivateFactory();
  const mutation = target?.action === "activate" ? activateMutation : deactivateMutation;

  async function handleConfirm() {
    if (!target) return;
    try {
      await mutation.mutateAsync(target.row.id);
      toast.success(target.action === "activate" ? "Factory activated." : "Factory deactivated.");
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
      title={isActivate ? "Activate Factory" : "Deactivate Factory"}
      description={
        isActivate
          ? `${target?.row.code ?? "This factory"} becomes available for new transactions again.`
          : `${target?.row.code ?? "This factory"} can no longer be used for new receiving, transfer, exchange, or adjustment transactions. Its trolleys, locations, and devices stay as-is.`
      }
      tone={isActivate ? "impact" : "destructive"}
      confirmLabel={isActivate ? "Confirm Activation" : "Confirm Deactivation"}
      onConfirm={handleConfirm}
      isConfirming={mutation.isPending}
    />
  );
}
