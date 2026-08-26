import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { PagedUsers, UserRow } from "@/core/users";
import { useUserFilterStore } from "../store";

vi.mock("@/core/users/data-source", () => ({
  fetchUsers: vi.fn(),
  fetchAllUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

vi.mock("@/core/master-data/data-source", () => ({
  fetchMasterData: vi.fn(),
  fetchMasterDataRow: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/administration/users",
}));

const { fetchUsers } = await import("@/core/users/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { UsersScreen } = await import("./users-screen");

const mockedFetchUsers = vi.mocked(fetchUsers);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: "USR-1",
    username: "budi.santoso",
    name: "Budi Santoso",
    status: "ACTIVE",
    roles: ["PIC_TROLI"],
    factoryIds: ["FAC-001"],
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedUsers> = {}): PagedUsers {
  return { items: [makeUser()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

beforeEach(() => {
  mockedFetchUsers.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchMasterData.mockResolvedValue([]);
  useUserFilterStore.setState({ page: 1, pageSize: 20 });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
  useSessionBootstrapStore.setState({ ready: true });
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UsersScreen", () => {
  it("renders populated rows as returned by the backend", async () => {
    mockedFetchUsers.mockResolvedValue(makePaged());

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("budi.santoso")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("PIC_TROLI")).toBeInTheDocument();
  });

  it("renders an EmptyState when there are no rows", async () => {
    mockedFetchUsers.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("renders an ErrorState with Retry for a non-403 error", async () => {
    const user = userEvent.setup();
    mockedFetchUsers.mockRejectedValueOnce(axiosError(500, "Internal error."));
    mockedFetchUsers.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("Internal error.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("budi.santoso")).toBeInTheDocument();
  });

  it("shows an access-denied state with no Retry button on a 403", async () => {
    mockedFetchUsers.mockRejectedValue(axiosError(403, "Missing USER_MANAGE"));

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("Missing USER_MANAGE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("skips the request entirely and shows access-denied when the real session has no USER_MANAGE", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchUsers).not.toHaveBeenCalled();
  });

  it("requests the next page and preserves the active filters", async () => {
    const user = userEvent.setup();
    mockedFetchUsers.mockResolvedValue(makePaged({ totalPages: 3, total: 50 }));

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    await vi.waitFor(() => {
      expect(mockedFetchUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it("requests the caller-scoped factory when TopBar's Factory selector isn't 'all'", async () => {
    mockedFetchUsers.mockResolvedValue(makePaged());
    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-002" });

    renderWithQueryClient(<UsersScreen />);

    await vi.waitFor(() => {
      expect(mockedFetchUsers).toHaveBeenCalledWith(expect.objectContaining({ factoryId: "FAC-002" }));
    });
  });

  it("shows a dash when a user carries no roles or no factory scope", async () => {
    mockedFetchUsers.mockResolvedValue(
      makePaged({ items: [makeUser({ roles: [], factoryIds: [] })] }),
    );

    renderWithQueryClient(<UsersScreen />);

    await screen.findByText("budi.santoso");
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("exposes no create/edit control — this screen is read-only", async () => {
    mockedFetchUsers.mockResolvedValue(makePaged());

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    expect(screen.queryByRole("button", { name: /add user/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });
});
