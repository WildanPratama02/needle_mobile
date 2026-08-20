"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDialogImpactRow {
  label: string;
  value: ReactNode;
  /** Bold, ocean-700 — the row a reader's eye should land on (e.g. "New Balance"). */
  emphasize?: boolean;
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /**
   * `impact` = stock-impacting (AlertTriangle, warning-600) — Receiving,
   * Transfer, a positive Adjustment. `destructive` = ShieldAlert, danger-600 —
   * reserved for an action that removes/reduces something irreversibly.
   */
  tone?: "impact" | "destructive";
  /** 2-column key-value impact summary, Docs/design.md §9.7. */
  impact?: ConfirmDialogImpactRow[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isConfirming?: boolean;
  confirmDisabled?: boolean;
}

/**
 * Docs/design.md §9.7 — the one ConfirmDialog implementation for every
 * stock-impacting action (Receiving/Transfer/Adjustment). Header = title +
 * icon; body = 2-column impact summary; footer = Cancel (ghost) + Confirm
 * (primary or destructive).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  tone = "impact",
  impact,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isConfirming = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const Icon = tone === "destructive" ? ShieldAlert : AlertTriangle;
  const iconClass = tone === "destructive" ? "text-danger-600" : "text-warning-600";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconClass)} />
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {impact && impact.length > 0 && (
          <dl className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
            {impact.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className={cn(row.emphasize ? "font-bold text-ocean-700" : "text-slate-900")}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isConfirming || confirmDisabled}
          >
            {isConfirming ? "Processing…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
