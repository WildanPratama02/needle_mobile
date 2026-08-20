import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import type { ResetPasswordResponse } from "@/core/auth/types";

const mockPush = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}));

vi.mock("@/core/auth/data-source", () => ({
  resetPassword: vi.fn(),
}));

const { resetPassword } = await import("@/core/auth/data-source");
const { ResetPasswordForm } = await import("./reset-password-form");
const mockedResetPassword = vi.mocked(resetPassword);

beforeEach(() => {
  mockedResetPassword.mockReset();
  mockPush.mockClear();
  mockToastSuccess.mockClear();
});

describe("ResetPasswordForm", () => {
  it("rejects a password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="reset-token" />);

    await user.type(screen.getByLabelText(/New password/), "abc123");
    await user.type(screen.getByLabelText(/Confirm new password/), "abc123");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it("rejects a password with no digit", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="reset-token" />);

    await user.type(screen.getByLabelText(/New password/), "abcdefgh");
    await user.type(screen.getByLabelText(/Confirm new password/), "abcdefgh");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Password must contain at least one digit")).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirmation", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="reset-token" />);

    await user.type(screen.getByLabelText(/New password/), "abcdefg1");
    await user.type(screen.getByLabelText(/Confirm new password/), "abcdefg2");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it("submits the token and new password, then redirects to /login without auto-login on success", async () => {
    const user = userEvent.setup();
    const response: ResetPasswordResponse = { message: "ok" };
    mockedResetPassword.mockResolvedValue(response);

    renderWithQueryClient(<ResetPasswordForm token="reset-token" />);
    await user.type(screen.getByLabelText(/New password/), "abcdefg1");
    await user.type(screen.getByLabelText(/Confirm new password/), "abcdefg1");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await vi.waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalledWith({ token: "reset-token", newPassword: "abcdefg1" });
    });
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("shows an inline error with a link to request a new link when the token is invalid or expired", async () => {
    const user = userEvent.setup();
    const error = new Error("Invalid or expired token.") as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = { status: 400, data: { error: { message: "Invalid or expired token." } } };
    mockedResetPassword.mockRejectedValue(error);

    renderWithQueryClient(<ResetPasswordForm token="reset-token" />);
    await user.type(screen.getByLabelText(/New password/), "abcdefg1");
    await user.type(screen.getByLabelText(/Confirm new password/), "abcdefg1");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Invalid or expired token.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
