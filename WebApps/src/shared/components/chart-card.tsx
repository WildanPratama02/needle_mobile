import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Docs/design.md §9.4. A layout shell only — loading/empty/error inside `children` is the caller's call. */
export function ChartCard({ title, action, footer, children, className }: ChartCardProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-3 text-xs text-slate-400">{footer}</div>}
    </div>
  );
}
