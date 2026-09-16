import { cn } from "@/lib/utils";

/** Signed, coloured variance (`actual - system`) — one rendering for the Adjustment form/table/detail and Physical Count. */
export function VarianceValue({ variance }: { variance: number }) {
  const sign = variance > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "font-bold",
        variance < 0 ? "text-danger-600" : variance > 0 ? "text-success-600" : "text-slate-700",
      )}
    >
      {sign}
      {variance}
    </span>
  );
}
