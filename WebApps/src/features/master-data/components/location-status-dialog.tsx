"use client";

import { toast } from "sonner";

import { getApiErrorMessage } from "@/core/api/client";
import type { Location } from "@/core/master-data";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useUpdateLocation } from "../api/location-queries";

export interface LocationStatusTarget {
  row: Location;
  action: "activate" | "deactivate";
}

/**
 * Activate/Deactivate as a row action.
 *
 * `Docs/12` §9 contracts no `activate`/`deactivate` pair for Location (unlike
 * Factory and Needle Type), so both go through `PATCH /locations/{id}`'s
 * `status` field — this screen does not invent endpoints the contract does not
 * have. The edit dialog carries the same field for the full-edit path; this is
 * the one-click path, with the consequence spelled out first.
 *
 * Deactivating blocks new use only. Movements already recorded against the
 * location stay readable (ticket 01 acceptance), which is what the copy says
 * rather than implying deletion.
 */
export function LocationStatusDialog({
  target,
  open,
  onOpenChange,
}: {
  target: LocationStatusTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateLocation();
  const isActivate = target?.action === "activate";

  async function handleConfirm() {
    if (!target) return;
    try {
      await updateMutation.mutateAsync({
        id: target.row.id,
        input: { status: target.action === "activate" ? "ACTIVE" : "INACTIVE" },
      });
      toast.success(target.action === "activate" ? "Location activated." : "Location deactivated.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isActivate ? "Activate Location" : "Deactivate Location"}
      description={
        isActivate
          ? `${target?.row.code ?? "This location"} becomes selectable again in receiving, transfer, return, adjustment and count forms.`
          : `${target?.row.code ?? "This location"} can no longer be chosen for new stock movements. Movements already recorded against it stay readable.`
      }
      tone={isActivate ? "impact" : "destructive"}
      confirmLabel={isActivate ? "Confirm Activation" : "Confirm Deactivation"}
      onConfirm={handleConfirm}
      isConfirming={updateMutation.isPending}
    />
  );
}
