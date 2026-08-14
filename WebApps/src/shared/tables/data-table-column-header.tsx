import type { RowData } from "@tanstack/react-table";
import type { LegacyColumn as Column } from "@tanstack/react-table/legacy";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DataTableColumnHeaderProps<TData extends RowData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
  /**
   * Show the sort-chevron affordance even though this column can't actually
   * sort (`column.enableSorting: false` at the table level) — for a screen
   * backed by an API with no sort param yet. Renders a muted, inert icon
   * with an explanatory `title` tooltip instead of hiding the affordance or
   * silently client-sorting a server-paginated dataset.
   */
  sortDisabledReason?: string;
}

/**
 * Docs/design.md §9.5: ChevronsUpDown idle (slate-400) -> ChevronUp/ChevronDown
 * active (ocean-600). Wire a column's `header` to this to make it sortable;
 * columns that don't need the affordance at all just render a plain string
 * header instead — this component is opt-in per column, not forced by
 * DataTable itself.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
  sortDisabledReason,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    if (!sortDisabledReason) {
      return <span className={className}>{title}</span>;
    }

    return (
      <span
        className={cn("inline-flex cursor-not-allowed items-center gap-1.5 text-slate-500", className)}
        title={sortDisabledReason}
      >
        {title}
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />
      </span>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "inline-flex items-center gap-1.5 hover:text-slate-700 focus-visible:outline-none",
        className
      )}
    >
      {title}
      {sorted === "asc" ? (
        <ChevronUp className="h-3.5 w-3.5 text-ocean-600" />
      ) : sorted === "desc" ? (
        <ChevronDown className="h-3.5 w-3.5 text-ocean-600" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
      )}
    </button>
  );
}
