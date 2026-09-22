import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { Factory, Location } from "@/core/master-data";

vi.mock("../api/location-data-source", () => ({
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
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

const { createLocation, updateLocation } = await import("../api/location-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { LocationScreen } = await import("./location-screen");

const mockedCreate = vi.mocked(createLocation);
const mockedUpdate = vi.mocked(updateLocation);
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
const WAREHOUSE: Location = {
  id: "LOC-WH",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "WAREHOUSE",
  parentLocationId: null,
};
const STORAGE: Location = {
  id: "LOC-UNS",
  code: "UNS-01",
  name: "Needle Hole A",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "USED_NEEDLE_STORAGE",
  parentLocationId: "LOC-WH",
};
const TROLLEY_LOCATION: Location = {
  id: "LOC-TRL",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "TROLLEY",
  parentLocationId: null,
};

function masterDataFor(collection: string) {
  if (collection === "factories") return [FACTORY];
  if (collection === "locations") return [WAREHOUSE, STORAGE, TROLLEY_LOCATION];
  return [];
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

function axiosError(status: number, message: string) {
  return {
    isAxiosError: true,
    response: { status, data: { success: false, error: { message, code: "ERROR", details: [] } } },
  };
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

async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
  renderWithQueryClient(<LocationScreen />);
  await screen.findByText("UNS-01");
  await user.click(screen.getByRole("button", { name: /New Location/ }));
  return screen.findByRole("dialog");
}

async function openEditDialog(user: ReturnType<typeof userEvent.setup>, code: string) {
  renderWithQueryClient(<LocationScreen />);
  await screen.findByText(code);
  await user.click(screen.getByRole("button", { name: `Edit ${code}` }));
  return screen.findByRole("dialog");
}

describe("LocationScreen", () => {
  it("refuses the screen to a caller without MASTER_VIEW", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<LocationScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchMasterData).not.toHaveBeenCalled();
  });

  it("lists every location type with its type, parent and status, and hides writes without MASTER_EDIT", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

    renderWithQueryClient(<LocationScreen />);

    const storageRow = (await screen.findByText("UNS-01")).closest("tr")!;
    expect(within(storageRow).getByText("Used Needle Storage", { selector: "td" })).toBeInTheDocument();
    expect(await within(storageRow).findByText("WH-01 — Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("TRL-A-01")).toBeInTheDocument();
    expect(screen.getByText("WH-01")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /New Location/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
  });

  it("scopes the list to the TopBar factory", async () => {
    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });

    renderWithQueryClient(<LocationScreen />);
    await screen.findByText("UNS-01");

    expect(mockedFetchMasterData).toHaveBeenCalledWith("locations", { factoryId: "FAC-001" });
  });

  it("filters by type client-side", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<LocationScreen />);
    await screen.findByText("UNS-01");

    await user.click(screen.getByRole("combobox", { name: "Filter by Type" }));
    await user.click(await screen.findByRole("option", { name: "Warehouse" }));

    expect(screen.getByText("WH-01")).toBeInTheDocument();
    expect(screen.queryByText("UNS-01")).not.toBeInTheDocument();
    expect(screen.queryByText("TRL-A-01")).not.toBeInTheDocument();
  });

  it("shows TROLLEY rows read-only, pointing at the Trolley screen instead of an Edit action", async () => {
    renderWithQueryClient(<LocationScreen />);

    const trolleyRow = (await screen.findByText("TRL-A-01")).closest("tr")!;
    expect(within(trolleyRow).queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(within(trolleyRow).getByRole("link", { name: "Managed via Trolleys" })).toHaveAttribute(
      "href",
      "/master-data/trolley",
    );

    const storageRow = screen.getByText("UNS-01").closest("tr")!;
    expect(within(storageRow).getByRole("button", { name: "Edit UNS-01" })).toBeInTheDocument();
  });

  it("creates a used-needle storage location under a warehouse parent, never offering TROLLEY as a type", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue({ ...STORAGE, id: "LOC-NEW", code: "UNS-02", name: "Needle Hole 2" });

    const dialog = await openCreateDialog(user);

    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

    await user.click(within(dialog).getByRole("combobox", { name: "Type" }));
    const typeOptions = await screen.findAllByRole("option");
    expect(typeOptions.map((option) => option.textContent)).toEqual(["Warehouse", "Used Needle Storage"]);
    await user.click(screen.getByRole("option", { name: "Used Needle Storage" }));

    await user.type(within(dialog).getByLabelText(/Location Code/), "UNS-02");
    await user.type(within(dialog).getByLabelText(/Location Name/), "Needle Hole 2");

    // Only WAREHOUSE locations are offered as a parent.
    await user.click(within(dialog).getByRole("combobox", { name: "Parent Location" }));
    const parentOptions = await screen.findAllByRole("option");
    expect(parentOptions.map((option) => option.textContent)).toEqual(["No parent", "WH-01 — Main Warehouse"]);
    await user.click(screen.getByRole("option", { name: "WH-01 — Main Warehouse" }));

    await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

    await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(mockedCreate.mock.calls[0][0]).toEqual({
      factoryId: "FAC-001",
      locationType: "USED_NEEDLE_STORAGE",
      code: "UNS-02",
      name: "Needle Hole 2",
      parentLocationId: "LOC-WH",
    });
  });

  it("refreshes the cached locations collection after a create", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue({ ...STORAGE, id: "LOC-NEW", code: "UNS-02", name: "Needle Hole 2" });

    const dialog = await openCreateDialog(user);
    const fetchesBefore = mockedFetchMasterData.mock.calls.filter(([collection]) => collection === "locations").length;

    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.type(within(dialog).getByLabelText(/Location Code/), "UNS-02");
    await user.type(within(dialog).getByLabelText(/Location Name/), "Needle Hole 2");
    await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

    await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    // No parent chosen -> the optional field is omitted rather than sent.
    expect(mockedCreate.mock.calls[0][0]).not.toHaveProperty("parentLocationId");
    await vi.waitFor(() =>
      expect(
        mockedFetchMasterData.mock.calls.filter(([collection]) => collection === "locations").length,
      ).toBeGreaterThan(fetchesBefore),
    );
  });

  it("routes a 409 duplicate code to the code field and keeps the dialog open", async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValue(axiosError(409, "A location with code UNS-01 already exists in this factory"));

    const dialog = await openCreateDialog(user);

    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.type(within(dialog).getByLabelText(/Location Code/), "UNS-01");
    await user.type(within(dialog).getByLabelText(/Location Name/), "Duplicate");
    await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

    const codeField = within(dialog).getByLabelText(/Location Code/);
    expect(await within(dialog).findByText(/already exists in this factory/)).toBeInTheDocument();
    expect(codeField).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("edits name/parent/status with code, factory and type read-only", async () => {
    const user = userEvent.setup();
    mockedUpdate.mockResolvedValue({ ...STORAGE, name: "Renamed", parentLocationId: null, status: "INACTIVE" });

    const dialog = await openEditDialog(user, "UNS-01");

    expect(within(dialog).getByDisplayValue("UNS-01")).toBeDisabled();
    expect(within(dialog).queryByRole("combobox", { name: "Type" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox", { name: "Factory" })).not.toBeInTheDocument();

    const nameField = within(dialog).getByLabelText(/Location Name/);
    await user.clear(nameField);
    await user.type(nameField, "Renamed");

    await user.click(within(dialog).getByRole("combobox", { name: "Parent Location" }));
    await user.click(await screen.findByRole("option", { name: "No parent" }));

    await user.click(within(dialog).getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Inactive" }));

    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate.mock.calls[0]).toEqual([
      "LOC-UNS",
      { name: "Renamed", parentLocationId: null, status: "INACTIVE" },
    ]);
  });

  it("shows the deactivate-while-mapped 409 inline so the user knows to remap first", async () => {
    const user = userEvent.setup();
    mockedUpdate.mockRejectedValue(
      axiosError(409, "Location is the destination of 2 active storage mapping(s); remap them first"),
    );

    const dialog = await openEditDialog(user, "UNS-01");

    await user.click(within(dialog).getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Inactive" }));
    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    expect(await within(dialog).findByText(/remap them first/)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
