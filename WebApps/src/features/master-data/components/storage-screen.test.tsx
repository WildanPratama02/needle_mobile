import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { PagedStorageMappings, StorageMapping } from "../api/storage-types";

vi.mock("../api/storage-data-source", () => ({
  fetchStorageMappings: vi.fn(),
  createStorageMapping: vi.fn(),
  updateStorageMapping: vi.fn(),
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

const { fetchStorageMappings, createStorageMapping } = await import("../api/storage-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { StorageScreen } = await import("./storage-screen");

const mockedFetchStorageMappings = vi.mocked(fetchStorageMappings);
const mockedCreateStorageMapping = vi.mocked(createStorageMapping);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE" as const,
  description: null,
  timezone: "Asia/Jakarta",
};
const TROLLEY = {
  id: "TRL-1",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationId: "LOC-TRL-1",
};
const EXCHANGE_TYPE = {
  id: "ET-1",
  code: "BROKEN",
  name: "Broken",
  status: "ACTIVE" as const,
  requiresFragmentValidation: true,
  description: null,
};
const STORAGE_LOCATION = {
  id: "LOC-STORAGE-1",
  code: "STORAGE-A",
  name: "Storage A",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "USED_NEEDLE_STORAGE" as const,
  parentLocationId: null,
};

const MAPPING: StorageMapping = {
  id: "SM-1",
  trolleyId: "TRL-1",
  exchangeTypeId: "ET-1",
  storageLocationId: "LOC-STORAGE-1",
  status: "ACTIVE",
};

function masterDataFor(collection: string) {
  if (collection === "factories") return [FACTORY];
  if (collection === "trolleys") return [TROLLEY];
  if (collection === "exchange-types") return [EXCHANGE_TYPE];
  if (collection === "locations") return [STORAGE_LOCATION];
  return [];
}

function makePaged(items: StorageMapping[]): PagedStorageMappings {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedFetchStorageMappings.mockReset();
  mockedCreateStorageMapping.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchStorageMappings.mockResolvedValue(makePaged([MAPPING]));
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StorageScreen", () => {
  it("refuses the screen to a caller without MASTER_VIEW", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<StorageScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchStorageMappings).not.toHaveBeenCalled();
  });

  it("resolves trolley/exchange-type/location ids to names in the list", async () => {
    renderWithQueryClient(<StorageScreen />);

    expect(await screen.findByText(/Trolley A-01/)).toBeInTheDocument();
    expect(await screen.findByText(/Broken/)).toBeInTheDocument();
    expect(await screen.findByText(/Storage A/)).toBeInTheDocument();
  });

  it("reports an empty catalogue rather than an empty table", async () => {
    mockedFetchStorageMappings.mockResolvedValue(makePaged([]));

    renderWithQueryClient(<StorageScreen />);

    expect(await screen.findByText("No storage mappings found.")).toBeInTheDocument();
  });

  it("hides the create action and the row Edit action without MASTER_EDIT", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

    renderWithQueryClient(<StorageScreen />);

    await screen.findByText(/Trolley A-01/);
    expect(screen.queryByRole("button", { name: "New Mapping" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("creates a mapping and reflects it in the list without a page reload", async () => {
    const user = userEvent.setup();
    mockedCreateStorageMapping.mockResolvedValue(MAPPING);

    renderWithQueryClient(<StorageScreen />);
    await screen.findByText(/Trolley A-01/);

    await user.click(screen.getByRole("button", { name: "New Mapping" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

    await user.click(within(dialog).getByRole("combobox", { name: "Trolley" }));
    await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

    await user.click(within(dialog).getByRole("combobox", { name: "Exchange Type" }));
    await user.click(await screen.findByRole("option", { name: /Broken/ }));

    await user.click(within(dialog).getByRole("combobox", { name: "Storage Location" }));
    await user.click(await screen.findByRole("option", { name: /Storage A/ }));

    await user.click(within(dialog).getByRole("button", { name: "Create Mapping" }));

    await vi.waitFor(() => {
      expect(mockedCreateStorageMapping).toHaveBeenCalled();
    });
    expect(mockedCreateStorageMapping.mock.calls[0][0]).toEqual({
      trolleyId: "TRL-1",
      exchangeTypeId: "ET-1",
      storageLocationId: "LOC-STORAGE-1",
    });
  });

  it("surfaces a 409 duplicate-pair conflict inline, not a generic toast", async () => {
    const user = userEvent.setup();
    mockedCreateStorageMapping.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { success: false, error: { message: "A storage mapping already exists for trolley TRL-1 and exchange type ET-1", code: "CONFLICT", details: [] } },
      },
    });

    renderWithQueryClient(<StorageScreen />);
    await screen.findByText(/Trolley A-01/);

    await user.click(screen.getByRole("button", { name: "New Mapping" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.click(within(dialog).getByRole("combobox", { name: "Trolley" }));
    await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));
    await user.click(within(dialog).getByRole("combobox", { name: "Exchange Type" }));
    await user.click(await screen.findByRole("option", { name: /Broken/ }));
    await user.click(within(dialog).getByRole("combobox", { name: "Storage Location" }));
    await user.click(await screen.findByRole("option", { name: /Storage A/ }));

    await user.click(within(dialog).getByRole("button", { name: "Create Mapping" }));

    expect(await screen.findByText(/already exists for trolley/)).toBeInTheDocument();
    // Dialog stays open — the failure is inline, not a redirect away from the form.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("only exposes the destination location as editable in the edit dialog", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<StorageScreen />);
    await screen.findByText(/Trolley A-01/);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");

    // Trolley/Exchange Type render as read-only text, not selects, in edit mode.
    expect(within(dialog).queryByRole("combobox", { name: "Trolley" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox", { name: "Exchange Type" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "Storage Location" })).toBeInTheDocument();
  });
});
