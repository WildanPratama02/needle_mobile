"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type RowData, type SortingState, type OnChangeFn, flexRender } from "@tanstack/react-table";
import {
  type LegacyColumnDef as ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { DataTablePagination } from "./data-table-pagination";

/**
 * `useRouter` is only safe where an App Router actually exists. Isolated
 * into its own component so it only ever mounts (and only ever calls the
 * hook) when a table actually uses `getRowHref` — a plain `DataTable` with
 * no row navigation never touches routing at all, in app code or in tests.
 */
function NavigableTableRow({
  href,
  children,
  isSelected,
}: {
  href: string;
  children: React.ReactNode;
  isSelected: boolean;
}) {
  const router = useRouter();
  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      className="cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(href);
      }}
    >
      {children}
    </TableRow>
  );
}

export interface DataTableProps<TData extends RowData> {
  /** Each column defines its own cell value type independently — that's why this isn't `ColumnDef<TData, TValue>[]` for one shared TValue. */
  columns: ColumnDef<TData, unknown>[];
  data: TData[];

  isLoading?: boolean;
  skeletonRowCount?: number;

  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;

  emptyTitle?: string;
  emptyDescription?: string;

  /**
   * Uncontrolled (client-side sort) if omitted. Pass both to hand sorting to
   * the caller instead — e.g. once a backend adds a real `sortBy` param, the
   * caller wires `onSortingChange` to refetch instead of letting TanStack
   * re-sort the current page in place.
   */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  /** Server/caller-owned pagination — this component never paginates on its own. */
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  onPageChange: (pageIndex: number) => void;

  /** When given, every row navigates to `getRowHref(row)` on click/Enter — e.g. a list screen's row-to-detail pattern. Omit for a non-navigable table. */
  getRowHref?: (row: TData) => string;

  className?: string;
}

/**
 * Docs/design.md §9.5 / §16 Phase 2. Generic — carries no Exchange (or any
 * other feature's) knowledge. Column defs decide what's sortable
 * (`DataTableColumnHeader`) and what an action cell looks like; this
 * component only owns layout, loading/empty/error states, and pagination
 * wiring.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading = false,
  skeletonRowCount = 5,
  isError = false,
  errorMessage,
  onRetry,
  emptyTitle = "No records found.",
  emptyDescription,
  sorting: controlledSorting,
  onSortingChange,
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  onPageChange,
  getRowHref,
  className,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const manualSorting = onSortingChange !== undefined;
  const sorting = controlledSorting ?? internalSorting;

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: onSortingChange ?? setInternalSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    manualPagination: true,
    pageCount,
  });

  const columnCount = columns.length;
  const showEmpty = !isLoading && !isError && data.length === 0;

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount}>
                <ErrorState message={errorMessage} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent">
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : showEmpty ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const href = getRowHref?.(row.original);
              const cells = row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ));

              if (href) {
                return (
                  <NavigableTableRow key={row.id} href={href} isSelected={row.getIsSelected()}>
                    {cells}
                  </NavigableTableRow>
                );
              }

              return (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {cells}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {!isLoading && !isError && data.length > 0 && (
        <DataTablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
