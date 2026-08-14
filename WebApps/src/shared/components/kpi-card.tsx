import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: { value: number; direction: "up" | "down" };
  isLoading?: boolean;
  className?: string;
}

/** Docs/design.md §9.3. */
export function KpiCard({ label, value, icon: Icon, delta, isLoading, className }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
        <div className="flex items-start justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-8 w-16" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-50">
          <Icon className="h-5 w-5 text-ocean-600" />
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            delta.direction === "up" ? "text-success-600" : "text-danger-600"
          )}
        >
          {delta.direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {delta.value}%
        </p>
      )}
    </div>
  );
}
