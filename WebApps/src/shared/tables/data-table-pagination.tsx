import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
}

/** Docs/design.md §9.5: bottom-right, "Showing 1–20 of 245". No shadcn Pagination primitive exists yet — this is scoped to DataTable's own needs, not a general-purpose page-number list. */
export function DataTablePagination({
  pageIndex,
  pageSize,
  totalRows,
  pageCount,
  onPageChange,
}: DataTablePaginationProps) {
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-end gap-4 pt-3">
      <span className="text-xs text-slate-500">
        Showing {start}–{end} of {totalRows}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={pageIndex <= 0}
          onClick={() => onPageChange(pageIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={pageIndex + 1 >= pageCount}
          onClick={() => onPageChange(pageIndex + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
