import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";

vi.mock("../api/data-source", () => ({
  fetchStockSummary: vi.fn().mockResolvedValue({
    totalStock: 500,
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockItems: [],
    outOfStockItems: [],
  }),
}));

const { StockAlertPanel } = await import("./stock-alert-panel");

describe("StockAlertPanel (empty)", () => {
  it("renders an EmptyState when there are no alerts", async () => {
    renderWithQueryClient(<StockAlertPanel />);

    expect(await screen.findByText("No stock alerts.")).toBeInTheDocument();
  });
});
