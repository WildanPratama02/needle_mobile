import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { RoleRow } from "@/core/roles";
import type { UserRow } from "@/core/users";

vi.mock("@/core/roles/data-source", () => ({
  fetchRoles: vi.fn(),
  fetchPermissions: vi.fn(),
}));

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
  usePathname: () => "/administration/roles/PIC_TROLI",
}));

const { fetchRoles } = await import("@/core/roles/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { RoleDetailScreen } = await import("./role-detail-screen");

const mockedFetchRoles = vi.mocked(fetchRoles);
const mockedFetchAllUsers = vi.mocked(fetchAllUsers);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeRole(overrides: Partial<RoleRow> = {}): RoleRow {
  return {
    code: "PIC_TROLI",
    permissionCodes: ["DASHBOARD_VIEW", "EXCHANGE_VIEW", "EXCHANGE_CREATE"],
    memberCount: 1,
    ...overrides,
  };
}

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

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

beforeEach(() => {
  mockedFetchRoles.mockReset();
  mockedFetchAllUsers.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchMasterData.mockResolvedValue([]);
  useSessionBootstrapStore.setState({ ready: true });
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RoleDetailScreen", () => {
  it("renders the role's full permission list and its members", async () => {
    mockedFetchRoles.mockResolvedValue([makeRole()]);
    mockedFetchAllUsers.mockResolvedValue([makeUser()]);

    renderWithQueryClient(<RoleDetailScreen code="PIC_TROLI" />);

    expect(await screen.findByText("EXCHANGE_CREATE")).toBeInTheDocument();
    expect(screen.getByText("DASHBOARD_VIEW")).toBeInTheDocument();
    expect(await screen.findByText("budi.santoso")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
  });

  it("requests GET /users?role=<code> for the member table, not the paginated /users list", async () => {
    mockedFetchRoles.mockResolvedValue([makeRole()]);
    mockedFetchAllUsers.mockResolvedValue([makeUser()]);

    renderWithQueryClient(<RoleDetailScreen code="PIC_TROLI" />);
    await screen.findByText("budi.santoso");

    expect(mockedFetchAllUsers).toHaveBeenCalledWith(expect.objectContaining({ role: "PIC_TROLI" }));
  });

  it("renders an EmptyState for a role with no current members", async () => {
    mockedFetchRoles.mockResolvedValue([makeRole()]);
    mockedFetchAllUsers.mockResolvedValue([]);

    renderWithQueryClient(<RoleDetailScreen code="PIC_TROLI" />);

    expect(await screen.findByText("No members found.")).toBeInTheDocument();
  });

  it("shows an access-denied state with no Retry button on a 403", async () => {
    mockedFetchRoles.mockRejectedValue(axiosError(403, "Missing USER_MANAGE"));
    mockedFetchAllUsers.mockRejectedValue(axiosError(403, "Missing USER_MANAGE"));

    renderWithQueryClient(<RoleDetailScreen code="PIC_TROLI" />);

    expect(await screen.findByText("Missing USER_MANAGE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("skips both requests entirely and shows access-denied when the real session has no USER_MANAGE", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<RoleDetailScreen code="PIC_TROLI" />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchRoles).not.toHaveBeenCalled();
    expect(mockedFetchAllUsers).not.toHaveBeenCalled();
  });

  it("exposes no edit-permissions or assign-role control — this screen is read-only", async () => {
    mockedFetchRoles.mockResolvedValue([makeRole()]);
    mockedFetchAllUsers.mockResolvedValue([makeUser()]);

    renderWithQueryClient(<RoleDetailScreen code="PIC_TROLI" />);
    await screen.findByText("budi.santoso");

    expect(screen.queryByRole("button", { name: /add permission/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /assign/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit/i })).not.toBeInTheDocument();
  });
});
