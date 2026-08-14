import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import type { LoginResponse } from "@/core/auth/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/core/auth/data-source", () => ({
  login: vi.fn(),
}));

const { login } = await import("@/core/auth/data-source");
const { LoginForm } = await import("./login-form");
const mockedLogin = vi.mocked(login);

function makeLoginResponse(): LoginResponse {
  return {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresIn: 900,
    user: { id: "USR-1", username: "admin", name: "Admin", roles: ["SYSTEM_ADMIN"] },
  };
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("LoginForm", () => {
  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("submits real field values and redirects to /dashboard on success", async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue(makeLoginResponse());

    renderWithQueryClient(<LoginForm />);
    await user.type(screen.getByLabelText(/Username/), "admin");
    await user.type(screen.getByLabelText(/Password/), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await vi.waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({ username: "admin", password: "secret" });
    });
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows the backend's real error message on invalid credentials, without redirecting", async () => {
    const user = userEvent.setup();
    const error = new Error("Invalid credentials.") as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = { status: 401, data: { error: { message: "Invalid credentials." } } };
    mockedLogin.mockRejectedValue(error);

    renderWithQueryClient(<LoginForm />);
    await user.type(screen.getByLabelText(/Username/), "admin");
    await user.type(screen.getByLabelText(/Password/), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials.")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
