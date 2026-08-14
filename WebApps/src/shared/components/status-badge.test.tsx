import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders the mapped label for a known status", () => {
    render(<StatusBadge status="LOW" />);
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
  });

  it("falls back to a neutral badge for an unknown status", () => {
    render(<StatusBadge status="SOMETHING_UNMAPPED" />);
    expect(screen.getByText("SOMETHING_UNMAPPED")).toBeInTheDocument();
  });

  it("prefers an explicit label override", () => {
    render(<StatusBadge status="PENDING_CONFIRMATION" label="3 Pending" />);
    expect(screen.getByText("3 Pending")).toBeInTheDocument();
  });

  it("maps the real ExchangeState enum values, not the differently-worded PENDING_CONFIRMATION", () => {
    render(<StatusBadge status="CONFIRMATION_PENDING" />);
    expect(screen.getByText("Confirmation Pending")).toBeInTheDocument();
  });

  it("maps every in-progress ExchangeState to the info treatment", () => {
    render(<StatusBadge status="NEEDLE_ISSUED" />);
    expect(screen.getByText("Needle Issued")).toBeInTheDocument();
  });
});
