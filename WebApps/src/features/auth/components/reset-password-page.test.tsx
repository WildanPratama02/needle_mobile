import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";

const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const { ResetPasswordScreen } = await import("./reset-password-page");

describe("ResetPasswordScreen", () => {
  it("renders the invalid-token error state instead of the form when token is missing from the query string", () => {
    mockGet.mockReturnValue(null);

    renderWithQueryClient(<ResetPasswordScreen />);

    expect(screen.getByText("This password reset link is invalid or has expired.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(screen.queryByLabelText(/New password/)).not.toBeInTheDocument();
  });

  it("renders the reset-password form when a token is present in the query string", () => {
    mockGet.mockReturnValue("reset-token");

    renderWithQueryClient(<ResetPasswordScreen />);

    expect(screen.getByLabelText(/New password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm new password/)).toBeInTheDocument();
  });
});
