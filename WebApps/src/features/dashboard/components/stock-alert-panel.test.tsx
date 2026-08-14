import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { StockAlertPanel } from "./stock-alert-panel";

describe("StockAlertPanel", () => {
  it("lists out-of-stock items before low-stock items from the fixture", async () => {
    renderWithQueryClient(<StockAlertPanel />);

    expect(await screen.findByText("Out of Stock")).toBeInTheDocument();
    expect(screen.getAllByText("Low Stock")).toHaveLength(2);
  });
});
