import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { Factory } from "@/core/master-data";

vi.mock("../api/factory-data-source", () => ({
  createFactory: vi.fn(),
  updateFactory: vi.fn(),
  activateFactory: vi.fn(),
  deactivateFactory: vi.fn(),
}));

vi.mock("@/core/master-data/data-source", () => ({
  fetchMasterData: vi.fn(),
  fetchMasterDataRow: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const { createFactory, updateFactory, activateFactory } = await import("../api/factory-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { FactoryScreen } = await import("./factory-screen");

const mockedCreate = vi.mocked(createFactory);
const mockedUpdate = vi.mocked(updateFactory);
const mockedActivate = vi.mocked(activateFactory);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const FACTORY: Factory = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "INACTIVE",
  description: null,
  timezone: "Asia/Jakarta",
};

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedCreate.mockReset();
  mockedUpdate.mockReset();
  mockedActivate.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) =>
    Promise.resolve(collection === "factories" ? [FACTORY] : ([] as never)),
  );
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FactoryScreen", () => {
  it("reports an empty catalogue rather than an empty table", async () => {
    mockedFetchMasterData.mockImplementation(() => Promise.resolve([] as never));

    renderWithQueryClient(<FactoryScreen />);

    expect(await screen.findByText("No factories in your scope.")).toBeInTheDocument();
  });

  it("hides Create/Edit/Activate without MASTER_EDIT", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

    renderWithQueryClient(<FactoryScreen />);

    await screen.findByText("FAC-BDG");
    expect(screen.queryByRole("button", { name: /New Factory/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Activate/ })).not.toBeInTheDocument();
  });

  it("creates a factory with the documented payload shape", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue({ ...FACTORY, id: "FAC-002", code: "FACTORY-01", status: "ACTIVE" });

    renderWithQueryClient(<FactoryScreen />);
    await screen.findByText("FAC-BDG");

    await user.click(screen.getByRole("button", { name: /New Factory/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/Factory Code/), "FACTORY-01");
    await user.type(within(dialog).getByLabelText(/Factory Name/), "Factory 01");
    const timezoneField = within(dialog).getByLabelText(/Timezone/);
    await user.clear(timezoneField);
    await user.type(timezoneField, "Asia/Jakarta");

    await user.click(within(dialog).getByRole("button", { name: "Create Factory" }));

    await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(mockedCreate.mock.calls[0][0]).toEqual({
      code: "FACTORY-01",
      name: "Factory 01",
      timezone: "Asia/Jakarta",
      description: undefined,
    });
  });

  it("edits a factory without touching its immutable code", async () => {
    const user = userEvent.setup();
    mockedUpdate.mockResolvedValue({ ...FACTORY, name: "Renamed Plant" });

    renderWithQueryClient(<FactoryScreen />);
    await screen.findByText("FAC-BDG");

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByDisplayValue("FAC-BDG")).toBeDisabled();

    const nameField = within(dialog).getByLabelText(/Factory Name/);
    await user.clear(nameField);
    await user.type(nameField, "Renamed Plant");

    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate.mock.calls[0]).toEqual([
      "FAC-001",
      { name: "Renamed Plant", timezone: "Asia/Jakarta", description: undefined },
    ]);
  });

  it("activates a factory through the confirm dialog", async () => {
    const user = userEvent.setup();
    mockedActivate.mockResolvedValue({ ...FACTORY, status: "ACTIVE" });

    renderWithQueryClient(<FactoryScreen />);
    await screen.findByText("FAC-BDG");

    await user.click(screen.getByRole("button", { name: /Activate/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm Activation" }));

    await vi.waitFor(() => expect(mockedActivate).toHaveBeenCalledWith("FAC-001"));
  });
});
