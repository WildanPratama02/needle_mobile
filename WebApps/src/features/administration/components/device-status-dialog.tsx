"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/core/api/client";
import { useActivateDevice, useRevokeDevice } from "../api/device-queries";
import type { Device } from "../api/device-types";

export type DeviceStatusAction = "activate" | "revoke";

/**
 * The "type a reason, then confirm" shape `ConfirmationPanel`'s Approve/
 * Reject dialogs already established, reused here for Device story 30 —
 * activate/revoke both need a confirmation step so an accidental click can't
 * silently take a tablet offline (or bring a revoked one back). The reason
 * is optional for both actions here: unlike Confirmation's Reject, nothing
 * in the spec makes a device reason mandatory, only the confirm step itself.
 */
export function DeviceStatusDialog({
  action,
  device,
  open,
  onOpenChange,
}: {
  action: DeviceStatusAction;
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const activateMutation = useActivateDevice();
  const revokeMutation = useRevokeDevice();
  const mutation = action === "activate" ? activateMutation : revokeMutation;

  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  async function handleConfirm() {
    if (!device) return;
    try {
      await mutation.mutateAsync({ id: device.id, reason });
      toast.success(action === "activate" ? "Device activated." : "Device revoked.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const isActivate = action === "activate";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isActivate ? "Activate Device" : "Revoke Device"}</DialogTitle>
          <DialogDescription>
            {isActivate
              ? `${device?.deviceCode ?? "This device"} will be allowed to authenticate and transact again.`
              : `${device?.deviceCode ?? "This device"} will no longer be able to authenticate. Reassigning or reactivating later does not require re-registration.`}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional note"
          aria-label="Reason"
        />

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isActivate ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={mutation.isPending || !device}
          >
            {isActivate ? "Confirm Activation" : "Confirm Revocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
