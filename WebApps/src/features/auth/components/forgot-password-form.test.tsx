import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import type { ForgotPasswordResponse } from "@/core/auth/types";

vi.mock("@/core/auth/data-source", () => ({
  forgotPassword: vi.fn(),
}));

const { forgotPassword } = await import("@/core/auth/data-source");
const { ForgotPasswordForm } = await import("./forgot-password-form");
const mockedForgotPassword = vi.mocked(forgotPassword);

beforeEach(() => {
  mockedForgotPassword.mockReset();
});

describe("ForgotPasswordForm", () => {
  it("shows a validation error when submitted empty", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it("shows a validation error for a malformed email", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it("shows the generic anti-enumeration message on success, regardless of whether the account exists", async () => {
    const user = userEvent.setup();
    const response: ForgotPasswordResponse = { message: "ok" };
    mockedForgotPassword.mockResolvedValue(response);

    renderWithQueryClient(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/Email/), "someone@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await vi.waitFor(() => {
      expect(mockedForgotPassword).toHaveBeenCalledWith({ email: "someone@example.com" });
    });
    expect(
      await screen.findByText("If an account exists for that email, a reset link has been sent.")
    ).toBeInTheDocument();
  });

  it("shows the backend's error message when the request itself fails", async () => {
    const user = userEvent.setup();
    const error = new Error("Something went wrong.") as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = { status: 500, data: { error: { message: "Something went wrong. Please try again." } } };
    mockedForgotPassword.mockRejectedValue(error);

    renderWithQueryClient(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/Email/), "someone@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
