import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { RoleRow, PermissionRow } from "@/core/roles";

const pushSpy = vi.fn();

vi.mock("@/core/roles/data-source", () => ({
  fetchRoles: vi.fn(),
  fetchPermissions: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/administration/roles",
}));

const { fetchRoles, fetchPermissions } = await import("@/core/roles/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { RolesScreen } = await import("./roles-screen");

const mockedFetchRoles = vi.mocked(fetchRoles);
const mockedFetchPermissions = vi.mocked(fetchPermissions);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeRole(overrides: Partial<RoleRow> = {}): RoleRow {
  return {
    code: "SYSTEM_ADMIN",
    permissionCodes: ["USER_MANAGE", "DEVICE_MANAGE"],
    memberCount: 2,
    ...overrides,
  };
}

function makePermissions(): PermissionRow[] {
  return [{ code: "USER_MANAGE" }, { code: "DEVICE_MANAGE" }, { code: "DASHBOARD_VIEW" }];
}

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

beforeEach(() => {
  mockedFetchRoles.mockReset();
  mockedFetchPermissions.mockReset();
  mockedFetchPermissions.mockResolvedValue(makePermissions());
  pushSpy.mockReset();
  useSessionBootstrapStore.setState({ ready: true });
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RolesScreen", () => {
  it("renders the five roles with their permission and member counts", async () => {
    mockedFetchRoles.mockResolvedValue([
      makeRole({ code: "SYSTEM_ADMIN", permissionCodes: Array.from({ length: 18 }, (_, i) => `PERM_${i}`), memberCount: 1 }),
      makeRole({ code: "PIC_TROLI", permissionCodes: ["EXCHANGE_CREATE"], memberCount: 4 }),
    ]);

    renderWithQueryClient(<RolesScreen />);

    expect(await screen.findByText("SYSTEM_ADMIN")).toBeInTheDocument();
    expect(screen.getByText("PIC_TROLI")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders the permission catalogue as a reference, independent of any one role", async () => {
    mockedFetchRoles.mockResolvedValue([makeRole()]);

    renderWithQueryClient(<RolesScreen />);

    expect(await screen.findByText("Permission Catalogue")).toBeInTheDocument();
    expect(await screen.findByText("DASHBOARD_VIEW")).toBeInTheDocument();
  });

  it("renders an ErrorState with Retry for a non-403 error", async () => {
    const user = userEvent.setup();
    mockedFetchRoles.mockRejectedValueOnce(axiosError(500, "Internal error."));
    mockedFetchRoles.mockResolvedValueOnce([makeRole()]);

    renderWithQueryClient(<RolesScreen />);

    expect(await screen.findByText("Internal error.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("SYSTEM_ADMIN")).toBeInTheDocument();
  });

  it("shows an access-denied state with no Retry button on a 403", async () => {
    mockedFetchRoles.mockRejectedValue(axiosError(403, "Missing USER_MANAGE"));

    renderWithQueryClient(<RolesScreen />);

    expect(await screen.findByText("Missing USER_MANAGE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("skips the request entirely and shows access-denied when the real session has no USER_MANAGE", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<RolesScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchRoles).not.toHaveBeenCalled();
  });

  it("navigates to the role detail route when a row is opened", async () => {
    const user = userEvent.setup();
    mockedFetchRoles.mockResolvedValue([makeRole({ code: "APPROVER" })]);

    renderWithQueryClient(<RolesScreen />);
    const cell = await screen.findByText("APPROVER");
    await user.click(cell.closest('[role="link"]') as HTMLElement);

    expect(pushSpy).toHaveBeenCalledWith("/administration/roles/APPROVER");
  });

  it("exposes no create/edit/assign control anywhere — this screen is read-only", async () => {
    mockedFetchRoles.mockResolvedValue([makeRole()]);

    renderWithQueryClient(<RolesScreen />);
    await screen.findByText("SYSTEM_ADMIN");

    expect(screen.queryByRole("button", { name: /add role/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /assign/i })).not.toBeInTheDocument();
  });
});
