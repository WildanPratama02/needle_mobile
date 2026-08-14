import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { DataTable } from "./data-table";
import { DataTableColumnHeader } from "./data-table-column-header";

interface Row {
  id: string;
  name: string;
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
  },
];

const rows: Row[] = [
  { id: "2", name: "Beta" },
  { id: "1", name: "Alpha" },
];

function baseProps() {
  return {
    columns,
    pageIndex: 0,
    pageSize: 10,
    pageCount: 1,
    totalRows: rows.length,
    onPageChange: vi.fn(),
  };
}

describe("DataTable", () => {
  it("renders populated rows", () => {
    render(<DataTable {...baseProps()} data={rows} />);
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("renders skeleton rows and no data while loading", () => {
    render(<DataTable {...baseProps()} data={[]} isLoading skeletonRowCount={3} />);
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("No records found.")).not.toBeInTheDocument();
    const rowsRendered = screen.getAllByRole("row");
    // header row + skeletonRowCount body rows
    expect(rowsRendered).toHaveLength(4);
  });

  it("renders an EmptyState when there is no data", () => {
    render(<DataTable {...baseProps()} data={[]} totalRows={0} />);
    expect(screen.getByText("No records found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and calls onRetry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<DataTable {...baseProps()} data={[]} isError errorMessage="Could not load rows." onRetry={onRetry} />);

    expect(screen.getByText("Could not load rows.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows the pagination range and disables Next on the last page", () => {
    render(<DataTable {...baseProps()} data={rows} />);
    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  it("calls onPageChange with the next page index", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        {...baseProps()}
        data={rows}
        pageIndex={0}
        pageCount={2}
        totalRows={20}
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("sorts client-side when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable {...baseProps()} data={rows} />);

    await user.click(screen.getByRole("button", { name: /Name/ }));

    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]).getByText("Alpha")).toBeInTheDocument();
    expect(within(bodyRows[1]).getByText("Beta")).toBeInTheDocument();
  });

  it("does not render a sort toggle for a column with sorting disabled", () => {
    render(<DataTable {...baseProps()} data={rows} />);
    expect(screen.queryByRole("button", { name: /^ID/ })).not.toBeInTheDocument();
  });
});
