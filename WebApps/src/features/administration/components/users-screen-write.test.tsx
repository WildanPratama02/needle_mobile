import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { PagedUsers, UserRow } from "@/core/users";
import type { RoleRow } from "@/core/roles";
import { useUserFilterStore } from "../store";

vi.mock("@/core/users/data-source", () => ({
  fetchUsers: vi.fn(),
  fetchAllUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

vi.mock("../api/user-write-data-source", () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  assignRole: vi.fn(),
  revokeRole: vi.fn(),
  assignFactoryScope: vi.fn(),
  revokeFactoryScope: vi.fn(),
}));

vi.mock("@/core/roles/data-source", () => ({
  fetchRoles: vi.fn(),
  fetchPermissions: vi.fn(),
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

// Real uuids: `CreateUserDto.factoryIds` (and the create form's zod schema) require them.
const FACTORY_ID = "7d8a1c9e-2f3b-4a5c-9d6e-1f2a3b4c5d6e";
const OTHER_FACTORY_ID = "0b1c2d3e-4f50-4617-8293-a4b5c6d7e8f9";

const { fetchUsers } = await import("@/core/users/data-source");
const { createUser, updateUser, assignRole, assignFactoryScope } = await import("../api/user-write-data-source");
const { fetchRoles } = await import("@/core/roles/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { UsersScreen } = await import("./users-screen");

const mockedFetchUsers = vi.mocked(fetchUsers);
const mockedCreateUser = vi.mocked(createUser);
const mockedUpdateUser = vi.mocked(updateUser);
const mockedAssignRole = vi.mocked(assignRole);
const mockedAssignFactoryScope = vi.mocked(assignFactoryScope);
const mockedFetchRoles = vi.mocked(fetchRoles);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: "USR-1",
    username: "budi.santoso",
    name: "Budi Santoso",
    status: "ACTIVE",
    roles: ["PIC_TROLI"],
    factoryIds: [FACTORY_ID],
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedUsers> = {}): PagedUsers {
  return { items: [makeUser()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

const FACTORY = { id: FACTORY_ID, code: "FAC-BDG", name: "Bandung Plant", status: "ACTIVE" as const, description: null, timezone: "Asia/Jakarta" };

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

const ROLES: RoleRow[] = [
  { code: "SYSTEM_ADMIN", permissionCodes: [], memberCount: 1 },
  { code: "PIC_TROLI", permissionCodes: [], memberCount: 2 },
];

beforeEach(() => {
  mockedFetchUsers.mockReset();
  mockedCreateUser.mockReset();
  mockedUpdateUser.mockReset();
  mockedAssignRole.mockReset();
  mockedAssignFactoryScope.mockReset();
  mockedFetchRoles.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();

  mockedFetchUsers.mockResolvedValue(makePaged());
  mockedFetchRoles.mockResolvedValue(ROLES);
  mockedFetchMasterData.mockImplementation((collection: string) =>
    Promise.resolve(collection === "factories" ? [FACTORY] : ([] as never)),
  );
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, factoryIds: [FACTORY_ID] });

  useUserFilterStore.setState({ page: 1, pageSize: 20 });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
  useSessionBootstrapStore.setState({ ready: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UsersScreen write flows (ticket 06)", () => {
  it("creates a user with the admin-set password and a factory scope", async () => {
    const user = userEvent.setup();
    mockedCreateUser.mockResolvedValue(
      makeUser({ id: "USR-2", username: "new.user", roles: [], factoryIds: [FACTORY_ID] }),
    );

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /New User/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/Username/), "new.user");
    await user.type(within(dialog).getByLabelText(/Name/), "New User");
    const password = within(dialog).getByLabelText(/Password/);
    expect(password).toHaveAttribute("type", "password");
    await user.type(password, "Password1");
    await user.click(await within(dialog).findByRole("checkbox", { name: /Bandung Plant/ }));
    await user.click(within(dialog).getByRole("button", { name: "Create User" }));

    await vi.waitFor(() => expect(mockedCreateUser).toHaveBeenCalled());
    expect(mockedCreateUser.mock.calls[0][0]).toEqual({
      username: "new.user",
      name: "New User",
      password: "Password1",
      factoryIds: [FACTORY_ID],
    });
  });

  it("blocks create when the password has no digit or no factory is selected", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /New User/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/Username/), "new.user");
    await user.type(within(dialog).getByLabelText(/Name/), "New User");
    await user.type(within(dialog).getByLabelText(/Password/), "Password");
    await user.click(within(dialog).getByRole("button", { name: "Create User" }));

    expect(await within(dialog).findByText("Password must contain at least 1 number")).toBeInTheDocument();
    expect(within(dialog).getByText("Select at least one factory")).toBeInTheDocument();
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /New User/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/Password/), "Pass1");
    await user.click(within(dialog).getByRole("button", { name: "Create User" }));

    expect(await within(dialog).findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("offers only the caller's own factories on create, not the full catalogue", async () => {
    const user = userEvent.setup();
    mockedFetchMasterData.mockImplementation((collection: string) =>
      Promise.resolve(
        collection === "factories"
          ? [FACTORY, { ...FACTORY, id: OTHER_FACTORY_ID, code: "FAC-SMG", name: "Semarang Plant" }]
          : ([] as never),
      ),
    );

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /New User/ }));
    const dialog = await screen.findByRole("dialog");

    expect(await within(dialog).findByRole("checkbox", { name: /Bandung Plant/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox", { name: /Semarang Plant/ })).not.toBeInTheDocument();
  });

  it("shows the backend's message when create is refused for an out-of-scope factory", async () => {
    const user = userEvent.setup();
    mockedCreateUser.mockRejectedValue(axiosError(403, "You cannot grant access to that factory."));

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /New User/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/Username/), "new.user");
    await user.type(within(dialog).getByLabelText(/Name/), "New User");
    await user.type(within(dialog).getByLabelText(/Password/), "Password1");
    await user.click(await within(dialog).findByRole("checkbox", { name: /Bandung Plant/ }));
    await user.click(within(dialog).getByRole("button", { name: "Create User" }));

    expect(await within(dialog).findByText("You cannot grant access to that factory.")).toBeInTheDocument();
  });

  it("edits a user's name/status without touching the immutable username", async () => {
    const user = userEvent.setup();
    mockedUpdateUser.mockResolvedValue(makeUser({ name: "Renamed" }));

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByDisplayValue("budi.santoso")).toBeDisabled();

    const nameField = within(dialog).getByLabelText(/Name/);
    await user.clear(nameField);
    await user.type(nameField, "Renamed");
    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    await vi.waitFor(() => expect(mockedUpdateUser).toHaveBeenCalled());
    expect(mockedUpdateUser.mock.calls[0]).toEqual(["USR-1", { name: "Renamed", status: "ACTIVE" }]);
  });

  it("deactivates a user through the confirm dialog", async () => {
    const user = userEvent.setup();
    mockedUpdateUser.mockResolvedValue(makeUser({ status: "INACTIVE" }));

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /Deactivate/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm Deactivation" }));

    await vi.waitFor(() => expect(mockedUpdateUser).toHaveBeenCalledWith("USR-1", { status: "INACTIVE" }));
  });

  it("assigns a role from the seeded catalogue via Manage Access", async () => {
    const user = userEvent.setup();
    mockedAssignRole.mockResolvedValue(makeUser({ roles: ["PIC_TROLI", "SYSTEM_ADMIN"] }));

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /Manage Access/ }));
    const dialog = await screen.findByRole("dialog");

    await screen.findByText("SYSTEM_ADMIN");
    const roleRow = within(dialog).getByText("SYSTEM_ADMIN").closest("li");
    expect(roleRow).not.toBeNull();
    await user.click(within(roleRow as HTMLElement).getByRole("button", { name: "Assign" }));

    await vi.waitFor(() =>
      expect(mockedAssignRole).toHaveBeenCalledWith("USR-1", "SYSTEM_ADMIN"),
    );
  });

  it("only offers the caller's own factory scope for assignment, not the full catalogue", async () => {
    const user = userEvent.setup();
    mockedAssignFactoryScope.mockResolvedValue(makeUser({ factoryIds: [FACTORY_ID] }));

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /Manage Access/ }));
    const dialog = await screen.findByRole("dialog");

    // Already held (FACTORY_ID) shows Remove, not Assign.
    const factoryRow = (await within(dialog).findByText(/Bandung Plant/)).closest("li");
    expect(factoryRow).not.toBeNull();
    expect(within(factoryRow as HTMLElement).getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("does not render Assign Location Scope or Reset Access controls anywhere", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<UsersScreen />);
    await screen.findByText("budi.santoso");

    await user.click(screen.getByRole("button", { name: /Manage Access/ }));
    await screen.findByRole("dialog");

    expect(screen.queryByText(/Location Scope/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reset Access/i })).not.toBeInTheDocument();
  });
});
