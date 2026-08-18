import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";

vi.mock("@/core/users/data-source", () => ({
  fetchUsers: vi.fn(),
}));

vi.mock("@/core/master-data/data-source", () => ({
  fetchMasterData: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const { fetchUsers } = await import("@/core/users/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { UsersScreen } = await import("./users-screen");

const mockedFetchUsers = vi.mocked(fetchUsers);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const USER = {
  id: "USR-001",
  username: "budi.santoso",
  name: "Budi Santoso",
  status: "ACTIVE" as const,
  roles: ["SYSTEM_ADMIN"],
  factoryIds: ["FAC-001"],
};

const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE" as const,
  description: null,
  timezone: "Asia/Jakarta",
};

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedFetchUsers.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchUsers.mockResolvedValue([USER]);
  mockedFetchMasterData.mockImplementation((collection: string) =>
    collection === "factories" ? Promise.resolve([FACTORY] as never) : Promise.resolve([] as never),
  );
  withPermissions([...MOCK_CURRENT_USER.permissions, "USER_MANAGE"]);
  useSessionBootstrapStore.setState({ ready: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UsersScreen", () => {
  it("renders users with username, name, status, roles and resolved factory scope", async () => {
    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("budi.santoso")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("SYSTEM_ADMIN")).toBeInTheDocument();
    expect(await screen.findByText("Bandung Plant")).toBeInTheDocument();
  });

  /** The backend is the boundary and would refuse anyway; hiding the screen first means never firing a request known to 403. */
  it("refuses the screen to a caller without USER_MANAGE", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchUsers).not.toHaveBeenCalled();
  });

  it("reports an empty scope rather than an empty table", async () => {
    mockedFetchUsers.mockResolvedValue([]);

    renderWithQueryClient(<UsersScreen />);

    expect(await screen.findByText("No users in your scope.")).toBeInTheDocument();
  });
});
