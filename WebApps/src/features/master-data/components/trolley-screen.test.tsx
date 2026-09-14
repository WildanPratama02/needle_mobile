import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { Factory, Location, Trolley } from "@/core/master-data";

vi.mock("../api/trolley-data-source", () => ({
  createTrolley: vi.fn(),
  updateTrolley: vi.fn(),
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

const { createTrolley, updateTrolley } = await import("../api/trolley-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { TrolleyScreen } = await import("./trolley-screen");

const mockedCreate = vi.mocked(createTrolley);
const mockedUpdate = vi.mocked(updateTrolley);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const FACTORY: Factory = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE",
  description: null,
  timezone: "Asia/Jakarta",
};
const TROLLEY: Trolley = {
  id: "TRL-1",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationId: "LOC-1",
};
const LOCATION: Location = {
  id: "LOC-2",
  code: "LOC-B",
  name: "Location B",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "TROLLEY",
  parentLocationId: null,
};

function masterDataFor(collection: string) {
  if (collection === "trolleys") return [TROLLEY];
  if (collection === "factories") return [FACTORY];
  if (collection === "locations") return [LOCATION];
  return [];
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedCreate.mockReset();
  mockedUpdate.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TrolleyScreen", () => {
  it("reports an empty catalogue rather than an empty table", async () => {
    mockedFetchMasterData.mockImplementation((collection: string) =>
      Promise.resolve(collection === "trolleys" ? [] : (masterDataFor(collection) as never)),
    );

    renderWithQueryClient(<TrolleyScreen />);

    expect(await screen.findByText("No trolleys in your scope.")).toBeInTheDocument();
  });

  it("hides Create/Edit without MASTER_EDIT", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

    renderWithQueryClient(<TrolleyScreen />);

    await screen.findByText("TRL-A-01");
    expect(screen.queryByRole("button", { name: /New Trolley/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
  });

  it("creates a trolley scoped to the selected factory", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue({ ...TROLLEY, id: "TRL-2", code: "TR-01", name: "Trolley 01" });

    renderWithQueryClient(<TrolleyScreen />);
    await screen.findByText("TRL-A-01");

    await user.click(screen.getByRole("button", { name: /New Trolley/ }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

    await user.type(within(dialog).getByLabelText(/Trolley Code/), "TR-01");
    await user.type(within(dialog).getByLabelText(/Trolley Name/), "Trolley 01");

    await user.click(within(dialog).getByRole("button", { name: "Create Trolley" }));

    await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(mockedCreate.mock.calls[0][0]).toEqual({ factoryId: "FAC-001", code: "TR-01", name: "Trolley 01" });
  });

  it("edits a trolley's name/location/status without a separate activate/deactivate control", async () => {
    const user = userEvent.setup();
    mockedUpdate.mockResolvedValue({ ...TROLLEY, name: "Renamed", locationId: "LOC-2", status: "INACTIVE" });

    renderWithQueryClient(<TrolleyScreen />);
    await screen.findByText("TRL-A-01");

    // No standalone Activate/Deactivate button pair, per ticket 03.
    expect(screen.queryByRole("button", { name: /Deactivate/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByDisplayValue("TRL-A-01")).toBeDisabled();

    const nameField = within(dialog).getByLabelText(/Trolley Name/);
    await user.clear(nameField);
    await user.type(nameField, "Renamed");

    await user.click(within(dialog).getByRole("combobox", { name: "Location" }));
    await user.click(await screen.findByRole("option", { name: /Location B/ }));

    await user.click(within(dialog).getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Inactive" }));

    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate.mock.calls[0]).toEqual([
      "TRL-1",
      { name: "Renamed", locationId: "LOC-2", status: "INACTIVE" },
    ]);
  });
});
