import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, prefetch: vi.fn() }),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { RequireAuth } = await import("./require-auth");
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

beforeEach(() => {
  mockReplace.mockClear();
  mockedFetchCurrentUser.mockReset();
  useSessionBootstrapStore.setState({ ready: true });
});

describe("RequireAuth", () => {
  it("renders children once the session resolves to a user", async () => {
    mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);

    renderWithQueryClient(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    );

    expect(await screen.findByText("Protected content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to /login and never renders children when there is no session", async () => {
    const error = new Error("Unauthorized") as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = { status: 401 };
    mockedFetchCurrentUser.mockRejectedValue(error);

    renderWithQueryClient(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    );

    await vi.waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("does not query /auth/me before SessionProvider's bootstrap has run", () => {
    useSessionBootstrapStore.setState({ ready: false });
    mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);

    renderWithQueryClient(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    );

    expect(mockedFetchCurrentUser).not.toHaveBeenCalled();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
