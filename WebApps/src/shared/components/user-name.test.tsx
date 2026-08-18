import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";

vi.mock("@/core/users/data-source", () => ({
  fetchUsers: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const { fetchUsers } = await import("@/core/users/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { UserName } = await import("./user-name");

const mockedFetchUsers = vi.mocked(fetchUsers);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const USER = {
  id: "USR-001",
  username: "budi.santoso",
  name: "Budi Santoso",
  status: "ACTIVE" as const,
  roles: ["SYSTEM_ADMIN"],
  factoryIds: ["FAC-001"],
};

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedFetchUsers.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchUsers.mockResolvedValue([USER]);
  useSessionBootstrapStore.setState({ ready: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UserName", () => {
  it("resolves a name for a caller holding USER_MANAGE", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "USER_MANAGE"]);

    renderWithQueryClient(<UserName id="USR-001" />);

    expect(await screen.findByText("budi.santoso — Budi Santoso")).toBeInTheDocument();
  });

  /**
   * Mirrors `AuditTimeline`'s `AUDIT_VIEW` gate: a caller lacking `USER_MANAGE`
   * never issues the request and never sees a 403 — the id renders via the
   * same fallback path an unresolved id already takes.
   */
  it("never requests the directory and falls back to the id for a caller without USER_MANAGE", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<UserName id="USR-001" />);

    expect(await screen.findByText("USR-001")).toBeInTheDocument();
    expect(mockedFetchUsers).not.toHaveBeenCalled();
  });

  it("falls back to the id, visibly, when a permitted lookup misses", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "USER_MANAGE"]);
    mockedFetchUsers.mockResolvedValue([]);

    renderWithQueryClient(<UserName id="USR-999" />);

    expect(await screen.findByText("USR-999")).toBeInTheDocument();
  });

  it("renders the empty label when the id itself is absent", () => {
    withPermissions(MOCK_CURRENT_USER.permissions);

    renderWithQueryClient(<UserName id={null} emptyLabel="System" />);

    expect(screen.getByText("System")).toBeInTheDocument();
  });
});
