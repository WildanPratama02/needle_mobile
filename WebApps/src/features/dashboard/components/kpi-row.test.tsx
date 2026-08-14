import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { KpiRow } from "./kpi-row";

describe("KpiRow", () => {
  it("resolves the fixture values into all four cards", async () => {
    renderWithQueryClient(<KpiRow />);

    expect(await screen.findByText("1245")).toBeInTheDocument();
    expect(screen.getByText("Total Exchange")).toBeInTheDocument();
    expect(screen.getByText("530")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("403")).toBeInTheDocument();
  });
});
