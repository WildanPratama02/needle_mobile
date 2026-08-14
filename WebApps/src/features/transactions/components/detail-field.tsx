import type { ReactNode } from "react";

/** Label/value pair for the Detail page's flat id/date fields — small enough it doesn't need to be a shared/ component yet. */
export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export function MonoValue({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-slate-600">{children}</span>;
}
