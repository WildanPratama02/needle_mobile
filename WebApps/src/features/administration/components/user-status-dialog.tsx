"use client";

import { toast } from "sonner";

import { getApiErrorMessage } from "@/core/api/client";
import type { UserRow } from "@/core/users";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useUpdateUser } from "../api/user-write-queries";

export interface UserStatusTarget {
  row: UserRow;
  action: "activate" | "deactivate";
}

/** Activate/Deactivate (ticket 06, FR-WEB-025) — goes through the same `PATCH .../:id` `status` field the Edit form uses, via a dedicated confirm step. */
export function UserStatusDialog({
  target,
  open,
  onOpenChange,
}: {
  target: UserStatusTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateUser();

  async function handleConfirm() {
    if (!target) return;
    try {
      await updateMutation.mutateAsync({
        id: target.row.id,
        input: { status: target.action === "activate" ? "ACTIVE" : "INACTIVE" },
      });
      toast.success(target.action === "activate" ? "User activated." : "User deactivated.");
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
      title={isActivate ? "Activate User" : "Deactivate User"}
      description={
        isActivate
          ? `${target?.row.username ?? "This user"} can sign in and act again.`
          : `${target?.row.username ?? "This user"} can no longer sign in.`
      }
      tone={isActivate ? "impact" : "destructive"}
      confirmLabel={isActivate ? "Confirm Activation" : "Confirm Deactivation"}
      onConfirm={handleConfirm}
      isConfirming={updateMutation.isPending}
    />
  );
}
