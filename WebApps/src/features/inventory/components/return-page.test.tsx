import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useReturnHistoryFilterStore } from "../store";
import type { BalanceItem, PagedBalances, ReturnResult } from "../api/types";
import type { Paged, ReturnHistoryItem } from "../api/operation-history-types";

/**
 * `/inventory/return` shares the history-first shape with Transfer, but Stock
 * Return is trolley → warehouse only (`.scratch/inventory-operation-history/spec.md`
 * decision 2) and its reason is mandatory — so those two rules, and the
 * pickers that express them, are what these tests are really about.
 */

vi.mock("../api/operation-history-data-source", () => ({
  fetchTransfers: vi.fn(),
  fetchTransfer: vi.fn(),
  fetchReturns: vi.fn(),
  fetchReturn: vi.fn(),
  fetchAdjustments: vi.fn(),
  fetchAdjustment: vi.fn(),
  uploadAdjustmentEvidence: vi.fn(),
}));

vi.mock("../api/data-source", () => ({
  fetchBalances: vi.fn(),
  fetchMovements: vi.fn(),
  fetchTrolleyStock: vi.fn(),
  createReceiving: vi.fn(),
  createTransfer: vi.fn(),
  createReturn: vi.fn(),
  createAdjustment: vi.fn(),
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

vi.mock("@/core/users/data-source", () => ({
  fetchAllUsers: vi.fn(),
  fetchUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

const { fetchReturns, fetchReturn } = await import("../api/operation-history-data-source");
const { fetchBalances, createReturn } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { ReturnScreen } = await import("./return-page");

const mockedFetchReturns = vi.mocked(fetchReturns);
const mockedFetchReturn = vi.mocked(fetchReturn);
const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedCreateReturn = vi.mocked(createReturn);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedFetchAllUsers = vi.mocked(fetchAllUsers);

const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE" as const,
  description: null,
  timezone: "Asia/Jakarta",
};
const TROLLEY_LOCATION = {
  id: "LOC-2",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "TROLLEY" as const,
  parentLocationId: null,
};
const WAREHOUSE_LOCATION = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
  parentLocationId: null,
};
const USED_NEEDLE_LOCATION = {
  id: "LOC-3",
  code: "UNS-01",
  name: "Used Needle Storage",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "USED_NEEDLE_STORAGE" as const,
  parentLocationId: null,
};
const NEEDLE_TYPE = {
  id: "NT-1",
  code: "DBX1",
  name: "DBx1",
  status: "ACTIVE" as const,
  category: null,
  unit: "pcs",
  minimumStock: 10,
  description: null,
};

function masterDataFor(collection: string) {
  if (collection === "factories") return [FACTORY];
  if (collection === "locations") return [TROLLEY_LOCATION, WAREHOUSE_LOCATION, USED_NEEDLE_LOCATION];
  if (collection === "needle-types") return [NEEDLE_TYPE];
  return [];
}

function makeReturn(overrides: Partial<ReturnHistoryItem> = {}): ReturnHistoryItem {
  return {
    id: "RET-1",
    factoryId: "FAC-001",
    sourceLocationId: "LOC-2",
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 10,
    referenceDocument: "RT-00007",
    reason: "Excess stock after shift",
    outMovementNumber: "MV-20260915-000005",
    inMovementNumber: "MV-20260915-000006",
    createdBy: "USR-000",
    createdAt: "2026-09-15T09:00:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<Paged<ReturnHistoryItem>> = {}): Paged<ReturnHistoryItem> {
  return { items: [makeReturn()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /New Return/ }));
  return screen.findByRole("heading", { name: "New Stock Return" });
}

async function fillReturnForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Source Location" }));
  await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

  await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
  await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

  await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));

  const quantity = screen.getByLabelText("Quantity *");
  await user.clear(quantity);
  await user.type(quantity, "10");
}

beforeEach(() => {
  mockedFetchReturns.mockReset();
  mockedFetchReturn.mockReset();
  mockedFetchBalances.mockReset();
  mockedCreateReturn.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  // STOCK_RETURN isn't in the shared fixture's grant list.
  withPermissions([...MOCK_CURRENT_USER.permissions, "STOCK_RETURN"]);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);
  mockedFetchReturns.mockResolvedValue(makePaged());
  mockedFetchBalances.mockImplementation((filters) => {
    const quantity = filters.locationId === "LOC-2" ? 30 : 5;
    const item: BalanceItem = {
      locationId: filters.locationId,
      needleTypeId: "NT-1",
      quantity,
      reservedQuantity: 0,
      availableQuantity: quantity,
    };
    return Promise.resolve({ items: [item], page: 1, pageSize: 1, total: 1, totalPages: 1 } satisfies PagedBalances);
  });

  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
  useReturnHistoryFilterStore.setState({
    locationId: "",
    needleTypeId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 20,
    extra: {},
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReturnScreen — history", () => {
  it("refuses the history to a caller without STOCK_VIEW", async () => {
    withPermissions(["STOCK_RETURN"]);

    renderWithQueryClient(<ReturnScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchReturns).not.toHaveBeenCalled();
  });

  it("renders a history row with its reason rather than a note", async () => {
    renderWithQueryClient(<ReturnScreen />);

    expect(await screen.findByText("MV-20260915-000005")).toBeInTheDocument();
    expect(screen.getByText("MV-20260915-000006")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Reason" })).toBeInTheDocument();
    expect(screen.getByText("Excess stock after shift")).toBeInTheDocument();
    expect(screen.getByText("RT-00007")).toBeInTheDocument();
  });

  it("tells a reader which way stock moves, so Transfer and Return are distinguishable", async () => {
    renderWithQueryClient(<ReturnScreen />);

    expect(await screen.findByText(/trolley to a warehouse/)).toBeInTheDocument();
  });

  it("renders an EmptyState when no returns match", async () => {
    mockedFetchReturns.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<ReturnScreen />);

    expect(await screen.findByText("No stock returns found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchReturns.mockRejectedValueOnce(new Error("network down"));
    mockedFetchReturns.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<ReturnScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("MV-20260915-000005")).toBeInTheDocument();
  });

  it("opens the detail for the row that was clicked", async () => {
    const user = userEvent.setup();
    mockedFetchReturn.mockResolvedValue(makeReturn());

    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");

    await user.click(screen.getByRole("button", { name: "View return MV-20260915-000005" }));

    expect(await screen.findByRole("heading", { name: "Stock Return Detail" })).toBeInTheDocument();
    expect(mockedFetchReturn).toHaveBeenCalledWith("RET-1");
  });

  it("opens the detail named by the ledger drill-through's ?id=", async () => {
    mockedFetchReturn.mockResolvedValue(makeReturn());

    renderWithQueryClient(<ReturnScreen initialDetailId="RET-1" />);

    expect(await screen.findByRole("heading", { name: "Stock Return Detail" })).toBeInTheDocument();
    await vi.waitFor(() => expect(mockedFetchReturn).toHaveBeenCalledWith("RET-1"));
  });
});

describe("ReturnScreen — create", () => {
  it("hides New Return from a caller who may read history but not return stock", async () => {
    withPermissions(["STOCK_VIEW"]);

    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");

    expect(screen.queryByRole("button", { name: /New Return/ })).not.toBeInTheDocument();
  });

  it("offers only trolley sources and only warehouse destinations", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");
    await openCreateForm(user);

    await user.click(screen.getByRole("combobox", { name: "Source Location" }));
    expect(await screen.findByRole("option", { name: /Trolley A-01/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Main Warehouse/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Used Needle Storage/ })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
    expect(await screen.findByRole("option", { name: /Main Warehouse/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Trolley A-01/ })).not.toBeInTheDocument();
  });

  it("labels the pickers for the one direction a return may take", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");
    await openCreateForm(user);

    expect(screen.getByText("Source Trolley *")).toBeInTheDocument();
    expect(screen.getByText("Destination Warehouse *")).toBeInTheDocument();
  });

  it("requires a reason before submit", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");
    await openCreateForm(user);
    await fillReturnForm(user);

    await user.click(screen.getByRole("button", { name: "Review Return" }));

    expect(await screen.findByText("Reason is required")).toBeInTheDocument();
    expect(mockedCreateReturn).not.toHaveBeenCalled();
  });

  it("submits the exact payload on confirm, with the reason and reference document", async () => {
    const user = userEvent.setup();
    mockedCreateReturn.mockResolvedValue({
      returnId: "RET-2",
      outMovementNumber: "MV-20260915-000007",
      inMovementNumber: "MV-20260915-000008",
      factoryId: "FAC-001",
      sourceLocationId: "LOC-2",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 10,
      referenceDocument: "RT-9",
      reason: "Excess stock",
      sourceBalanceQuantity: 20,
      destinationBalanceQuantity: 15,
      createdAt: "2026-09-15T09:30:00.000Z",
    } satisfies ReturnResult);

    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");
    await openCreateForm(user);
    await fillReturnForm(user);
    await user.type(screen.getByLabelText("Reference Document"), "RT-9");
    await user.type(screen.getByLabelText("Reason *"), "Excess stock");

    await user.click(screen.getByRole("button", { name: "Review Return" }));
    expect(await screen.findByRole("heading", { name: "Confirm Return" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm Return" }));

    await vi.waitFor(() => expect(mockedCreateReturn).toHaveBeenCalledTimes(1));
    expect(mockedCreateReturn.mock.calls[0][0]).toEqual({
      factoryId: "FAC-001",
      sourceLocationId: "LOC-2",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 10,
      referenceDocument: "RT-9",
      reason: "Excess stock",
    });
  });

  it("closes the form and refetches the history after a successful return", async () => {
    const user = userEvent.setup();
    mockedCreateReturn.mockResolvedValue({
      returnId: "RET-2",
      outMovementNumber: "MV-20260915-000007",
      inMovementNumber: "MV-20260915-000008",
      factoryId: "FAC-001",
      sourceLocationId: "LOC-2",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 10,
      referenceDocument: null,
      reason: "Excess stock",
      sourceBalanceQuantity: 20,
      destinationBalanceQuantity: 15,
      createdAt: "2026-09-15T09:30:00.000Z",
    } satisfies ReturnResult);

    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");
    const callsBefore = mockedFetchReturns.mock.calls.length;

    await openCreateForm(user);
    await fillReturnForm(user);
    await user.type(screen.getByLabelText("Reason *"), "Excess stock");
    await user.click(screen.getByRole("button", { name: "Review Return" }));
    await screen.findByRole("heading", { name: "Confirm Return" });
    await user.click(screen.getByRole("button", { name: "Confirm Return" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("heading", { name: "New Stock Return" })).not.toBeInTheDocument();
    });
    await vi.waitFor(() => {
      expect(mockedFetchReturns.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it("surfaces the backend's wrong-location-type 400 inline rather than as a toast", async () => {
    const user = userEvent.setup();
    const badRequest = new AxiosError("Bad Request", "ERR_BAD_REQUEST");
    badRequest.response = {
      status: 400,
      data: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "A return must go from a TROLLEY location to a WAREHOUSE location",
          details: [],
        },
      },
    } as AxiosResponse;
    mockedCreateReturn.mockRejectedValue(badRequest);

    renderWithQueryClient(<ReturnScreen />);
    await screen.findByText("MV-20260915-000005");
    await openCreateForm(user);
    await fillReturnForm(user);
    await user.type(screen.getByLabelText("Reason *"), "Excess stock");
    await user.click(screen.getByRole("button", { name: "Review Return" }));
    await screen.findByRole("heading", { name: "Confirm Return" });
    await user.click(screen.getByRole("button", { name: "Confirm Return" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/must go from a TROLLEY location/)).toBeInTheDocument();
  });
});
