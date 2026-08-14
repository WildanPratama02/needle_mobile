import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";

vi.mock("../api/data-source", () => ({
  fetchDashboardOverview: vi.fn().mockRejectedValue(new Error("network down")),
}));

const { KpiRow } = await import("./kpi-row");

describe("KpiRow (error)", () => {
  it("renders an ErrorState instead of the KPI grid when the fetch fails", async () => {
    renderWithQueryClient(<KpiRow />);

    expect(await screen.findByText("Could not load dashboard KPIs.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
