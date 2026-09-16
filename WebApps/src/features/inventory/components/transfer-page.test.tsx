import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useTransferHistoryFilterStore } from "../store";
import type { BalanceItem, PagedBalances, TransferResult } from "../api/types";
import type { Paged, TransferHistoryItem } from "../api/operation-history-types";

/**
 * `/inventory/transfer` is history-first
 * (`.scratch/inventory-operation-history/spec.md` decision 1): the page is
 * filters + paged history, a row opens its detail, and the create form lives
 * behind "New Transfer". These tests follow that shape — the history read and
 * the create write are separately permissioned (decision 8), so they are
 * gated, and asserted, separately.
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

// The whole seam, not just the two functions this screen uses: the form
// mounts `useCreateTransfer` and `useCreateReturn` together, and a mock
// missing an export throws the moment the hook reads it.
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

// The Actor column resolves a user id to a name through `core/users`.
vi.mock("@/core/users/data-source", () => ({
  fetchAllUsers: vi.fn(),
  fetchUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

const { fetchTransfers, fetchTransfer } = await import("../api/operation-history-data-source");
const { fetchBalances, createTransfer } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { TransferScreen } = await import("./transfer-page");

const mockedFetchTransfers = vi.mocked(fetchTransfers);
const mockedFetchTransfer = vi.mocked(fetchTransfer);
const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedCreateTransfer = vi.mocked(createTransfer);
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
const SOURCE_LOCATION = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
  parentLocationId: null,
};
const DESTINATION_LOCATION = {
  id: "LOC-2",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "TROLLEY" as const,
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
  if (collection === "locations") return [SOURCE_LOCATION, DESTINATION_LOCATION];
  if (collection === "needle-types") return [NEEDLE_TYPE];
  return [];
}

function makeTransfer(overrides: Partial<TransferHistoryItem> = {}): TransferHistoryItem {
  return {
    id: "TRF-1",
    factoryId: "FAC-001",
    sourceLocationId: "LOC-1",
    destinationLocationId: "LOC-2",
    needleTypeId: "NT-1",
    quantity: 20,
    referenceDocument: "DO-0012",
    note: "Replenishment trolley",
    outMovementNumber: "MV-20260915-000001",
    inMovementNumber: "MV-20260915-000002",
    createdBy: "USR-000",
    createdAt: "2026-09-15T08:00:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<Paged<TransferHistoryItem>> = {}): Paged<TransferHistoryItem> {
  return { items: [makeTransfer()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function balanceFor(locationId: string, quantity: number): BalanceItem {
  return { locationId, needleTypeId: "NT-1", quantity, reservedQuantity: 0, availableQuantity: quantity };
}

async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /New Transfer/ }));
  return screen.findByRole("heading", { name: "New Transfer" });
}

async function fillTransferForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Source Location" }));
  await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

  await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
  await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

  await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));

  const quantity = screen.getByLabelText("Quantity *");
  await user.clear(quantity);
  await user.type(quantity, "20");
}

beforeEach(() => {
  mockedFetchTransfers.mockReset();
  mockedFetchTransfer.mockReset();
  mockedFetchBalances.mockReset();
  mockedCreateTransfer.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);
  mockedFetchTransfers.mockResolvedValue(makePaged());
  mockedFetchBalances.mockImplementation((filters) => {
    const quantity = filters.locationId === "LOC-1" ? 100 : 5;
    return Promise.resolve({
      items: [balanceFor(filters.locationId, quantity)],
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    } satisfies PagedBalances);
  });

  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
  useTransferHistoryFilterStore.setState({
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

describe("TransferScreen — history", () => {
  it("refuses the history to a caller without STOCK_VIEW, and never requests it", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["STOCK_TRANSFER"] });

    renderWithQueryClient(<TransferScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchTransfers).not.toHaveBeenCalled();
  });

  it("renders a history row with both movement numbers, the route, reference and note", async () => {
    renderWithQueryClient(<TransferScreen />);

    expect(await screen.findByText("MV-20260915-000001")).toBeInTheDocument();
    expect(screen.getByText("MV-20260915-000002")).toBeInTheDocument();
    // Location and needle-type names come from the master-data lookups, which
    // settle a beat after the row itself.
    expect(await screen.findByText("WH-01 — Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("TRL-A-01 — Trolley A-01")).toBeInTheDocument();
    expect(screen.getByText("DBX1 — DBx1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("DO-0012")).toBeInTheDocument();
    expect(screen.getByText("Replenishment trolley")).toBeInTheDocument();
    // Actor resolves to a name, never a raw uuid.
    expect(await screen.findByText("Test Admin")).toBeInTheDocument();
  });

  it("renders an EmptyState when no transfers match", async () => {
    mockedFetchTransfers.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<TransferScreen />);

    expect(await screen.findByText("No transfers found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchTransfers.mockRejectedValueOnce(new Error("network down"));
    mockedFetchTransfers.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<TransferScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("MV-20260915-000001")).toBeInTheDocument();
  });

  it("requests the chosen location, needle type and date range", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

    fireEvent.change(screen.getByLabelText("Date From"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Date To"), { target: { value: "2026-09-15" } });

    await vi.waitFor(() => {
      expect(mockedFetchTransfers).toHaveBeenLastCalledWith(
        expect.objectContaining({ locationId: "LOC-1", dateFrom: "2026-09-01", dateTo: "2026-09-15" }),
      );
    });
  });

  it("resets to page 1 when a filter changes", async () => {
    const user = userEvent.setup();
    useTransferHistoryFilterStore.setState({ page: 3 });

    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));

    await vi.waitFor(() => {
      expect(mockedFetchTransfers).toHaveBeenLastCalledWith(
        expect.objectContaining({ needleTypeId: "NT-1", page: 1 }),
      );
    });
  });

  it("opens the detail for the row that was clicked", async () => {
    const user = userEvent.setup();
    mockedFetchTransfer.mockResolvedValue(makeTransfer());

    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");

    await user.click(screen.getByRole("button", { name: "View transfer MV-20260915-000001" }));

    expect(await screen.findByRole("heading", { name: "Transfer Detail" })).toBeInTheDocument();
    expect(mockedFetchTransfer).toHaveBeenCalledWith("TRF-1");
  });

  it("opens the detail named by the ledger drill-through's ?id=", async () => {
    mockedFetchTransfer.mockResolvedValue(makeTransfer());

    renderWithQueryClient(<TransferScreen initialDetailId="TRF-1" />);

    expect(await screen.findByRole("heading", { name: "Transfer Detail" })).toBeInTheDocument();
    await vi.waitFor(() => expect(mockedFetchTransfer).toHaveBeenCalledWith("TRF-1"));
  });

  it("surfaces a detail that could not be loaded as an error, not a blank dialog", async () => {
    const notFound = new AxiosError("Not Found", "ERR_BAD_REQUEST");
    notFound.response = {
      status: 404,
      data: { success: false, error: { code: "NOT_FOUND", message: "Transfer not found: TRF-9", details: [] } },
    } as AxiosResponse;
    mockedFetchTransfer.mockRejectedValue(notFound);

    renderWithQueryClient(<TransferScreen initialDetailId="TRF-9" />);

    expect(await screen.findByText("Transfer not found: TRF-9")).toBeInTheDocument();
  });
});

describe("TransferScreen — create", () => {
  it("hides New Transfer from a caller who may read history but not transfer", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["STOCK_VIEW"] });

    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");

    expect(screen.queryByRole("button", { name: /New Transfer/ })).not.toBeInTheDocument();
  });

  it("blocks submit when source and destination are the same location", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);

    await user.click(screen.getByRole("combobox", { name: "Source Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));
    await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));
    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));

    await user.click(screen.getByRole("button", { name: "Review Transfer" }));

    expect(await screen.findByText("Source and destination must be different locations")).toBeInTheDocument();
    expect(mockedCreateTransfer).not.toHaveBeenCalled();
  });

  it("shows the live available quantity at the source while typing", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);

    await user.click(screen.getByRole("combobox", { name: "Source Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));
    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));

    const available = await screen.findByTestId("source-available");
    await vi.waitFor(() => expect(available).toHaveTextContent("100"));
  });

  it("warns when the quantity exceeds what the source holds, without deciding the outcome", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);

    await user.click(screen.getByRole("combobox", { name: "Source Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));
    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));
    await screen.findByTestId("source-available");

    const quantity = screen.getByLabelText("Quantity *");
    await user.clear(quantity);
    await user.type(quantity, "500");

    expect(await screen.findByText(/more than the source currently holds/)).toBeInTheDocument();
  });

  it("reviews the balance impact, then submits the exact payload including the reference document", async () => {
    const user = userEvent.setup();
    mockedCreateTransfer.mockResolvedValue({
      transferId: "TRF-2",
      outMovementNumber: "MV-20260915-000003",
      inMovementNumber: "MV-20260915-000004",
      factoryId: "FAC-001",
      sourceLocationId: "LOC-1",
      destinationLocationId: "LOC-2",
      needleTypeId: "NT-1",
      quantity: 20,
      referenceDocument: "DO-9",
      note: "Top up",
      sourceBalanceQuantity: 80,
      destinationBalanceQuantity: 25,
      createdAt: "2026-09-15T08:30:00.000Z",
    } satisfies TransferResult);

    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillTransferForm(user);

    await user.type(screen.getByLabelText("Reference Document"), "DO-9");
    await user.type(screen.getByLabelText("Note"), "Top up");

    await user.click(screen.getByRole("button", { name: "Review Transfer" }));

    expect(await screen.findByRole("heading", { name: "Confirm Transfer" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    await vi.waitFor(() => expect(mockedCreateTransfer).toHaveBeenCalledTimes(1));
    expect(mockedCreateTransfer.mock.calls[0][0]).toEqual({
      factoryId: "FAC-001",
      sourceLocationId: "LOC-1",
      destinationLocationId: "LOC-2",
      needleTypeId: "NT-1",
      quantity: 20,
      referenceDocument: "DO-9",
      note: "Top up",
    });
  });

  it("closes the form and refetches the history after a successful transfer", async () => {
    const user = userEvent.setup();
    mockedCreateTransfer.mockResolvedValue({
      transferId: "TRF-2",
      outMovementNumber: "MV-20260915-000003",
      inMovementNumber: "MV-20260915-000004",
      factoryId: "FAC-001",
      sourceLocationId: "LOC-1",
      destinationLocationId: "LOC-2",
      needleTypeId: "NT-1",
      quantity: 20,
      referenceDocument: null,
      note: null,
      sourceBalanceQuantity: 80,
      destinationBalanceQuantity: 25,
      createdAt: "2026-09-15T08:30:00.000Z",
    } satisfies TransferResult);

    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");
    const callsBefore = mockedFetchTransfers.mock.calls.length;

    await openCreateForm(user);
    await fillTransferForm(user);
    await user.click(screen.getByRole("button", { name: "Review Transfer" }));
    await screen.findByRole("heading", { name: "Confirm Transfer" });
    await user.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("heading", { name: "New Transfer" })).not.toBeInTheDocument();
    });
    // The create mutation invalidates the whole `inventory` key space, which
    // the history list lives under.
    await vi.waitFor(() => {
      expect(mockedFetchTransfers.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it("surfaces a 409 insufficient-stock error inline in the form", async () => {
    const user = userEvent.setup();
    const insufficientStock = new AxiosError("Conflict", "ERR_BAD_REQUEST");
    insufficientStock.response = {
      status: 409,
      data: {
        success: false,
        error: {
          code: "CONFLICT",
          message: "Insufficient stock at location LOC-1 for needle type NT-1: 20 requested",
          details: [],
        },
      },
    } as AxiosResponse;
    mockedCreateTransfer.mockRejectedValue(insufficientStock);

    renderWithQueryClient(<TransferScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillTransferForm(user);
    await user.click(screen.getByRole("button", { name: "Review Transfer" }));
    await screen.findByRole("heading", { name: "Confirm Transfer" });
    await user.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Insufficient stock at location LOC-1/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Confirm Transfer" })).not.toBeInTheDocument();
  });
});
