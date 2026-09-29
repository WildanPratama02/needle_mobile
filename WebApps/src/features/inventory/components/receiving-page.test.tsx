import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useReceivingHistoryFilterStore } from "../store";
import type { BalanceItem, PagedBalances, ReceivingResult } from "../api/types";
import type { Paged, ReceivingHistoryItem } from "../api/operation-history-types";

/**
 * `/inventory/receiving` is history-first
 * (`.scratch/receiving-supplier/issues/03`): filters + paged history, a row
 * opens its detail, and the create form lives behind "New Receiving". The
 * history read (`STOCK_VIEW`) and the create write (`STOCK_RECEIVE`) are
 * separately permissioned, so they are gated, and asserted, separately.
 *
 * The two rules this ticket adds are asserted where they are enforced: a
 * receiving cannot be submitted without a supplier, and a future received date
 * never leaves the browser. Both are UX guards over a backend that still
 * refuses — which is why the legacy-null supplier case is here too: the
 * history must render what the server actually returned, including "no
 * supplier was recorded", rather than invent one.
 */

vi.mock("../api/operation-history-data-source", () => ({
  fetchTransfers: vi.fn(),
  fetchTransfer: vi.fn(),
  fetchReturns: vi.fn(),
  fetchReturn: vi.fn(),
  fetchAdjustments: vi.fn(),
  fetchAdjustment: vi.fn(),
  fetchReceivings: vi.fn(),
  fetchReceiving: vi.fn(),
  uploadAdjustmentEvidence: vi.fn(),
}));

// The whole seam, not just the functions this screen uses: `queries.ts`
// mounts every create mutation together, and a mock missing an export throws
// the moment a hook reads it.
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

const { fetchReceivings, fetchReceiving } = await import("../api/operation-history-data-source");
const { fetchBalances, createReceiving } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { ReceivingScreen } = await import("./receiving-page");

const mockedFetchReceivings = vi.mocked(fetchReceivings);
const mockedFetchReceiving = vi.mocked(fetchReceiving);
const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedCreateReceiving = vi.mocked(createReceiving);
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
const WAREHOUSE = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
  parentLocationId: null,
};
const TROLLEY = {
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
/** A supplier carries no `status` at all — spec decision 6, mirrored in `Supplier`. */
const SUPPLIER = { id: "SUP-1", code: "SUP-ACME", name: "Acme Needles", contact: null, description: null };

function masterDataFor(collection: string, query?: { locationType?: string }) {
  if (collection === "factories") return [FACTORY];
  if (collection === "locations") {
    const rows = [WAREHOUSE, TROLLEY];
    return query?.locationType ? rows.filter((row) => row.locationType === query.locationType) : rows;
  }
  if (collection === "needle-types") return [NEEDLE_TYPE];
  if (collection === "suppliers") return [SUPPLIER];
  return [];
}

function makeReceiving(overrides: Partial<ReceivingHistoryItem> = {}): ReceivingHistoryItem {
  return {
    id: "RCV-1",
    movementNumber: "MV-20260915-000001",
    factoryId: "FAC-001",
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 500,
    supplierId: "SUP-1",
    receivedDate: "2026-09-12",
    referenceDocument: "GR-00001",
    note: "First delivery of the quarter",
    createdBy: "USR-000",
    createdAt: "2026-09-15T08:00:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<Paged<ReceivingHistoryItem>> = {}): Paged<ReceivingHistoryItem> {
  return { items: [makeReceiving()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function balanceFor(locationId: string, quantity: number): BalanceItem {
  return { locationId, needleTypeId: "NT-1", quantity, reservedQuantity: 0, availableQuantity: quantity };
}

function createdResult(overrides: Partial<ReceivingResult> = {}): ReceivingResult {
  return {
    receivingId: "RCV-2",
    movementId: "MOV-2",
    movementNumber: "MV-20260916-000010",
    factoryId: "FAC-001",
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 20,
    supplierId: "SUP-1",
    receivedDate: "2026-09-16",
    referenceDocument: null,
    note: null,
    balanceQuantity: 120,
    createdAt: "2026-09-16T02:00:00.000Z",
    ...overrides,
  };
}

/** Today in the browser's zone, the same `yyyy-MM-dd` the form defaults to. */
function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

function shiftDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /New Receiving/ }));
  return screen.findByRole("heading", { name: "New Receiving" });
}

/**
 * `findByRole` between picks, not `getByRole`: while a Radix Select is open it
 * marks the rest of the dialog `aria-hidden`, so a synchronous role query
 * fired before the close settles can miss the next combobox. Waiting for it is
 * the fix, not a longer timeout.
 */
async function fillReceivingForm(
  user: ReturnType<typeof userEvent.setup>,
  opts: { supplier?: boolean } = {},
) {
  if (opts.supplier !== false) {
    await user.click(await screen.findByRole("combobox", { name: "Supplier" }));
    await user.click(await screen.findByRole("option", { name: /Acme Needles/ }));
  }

  await user.click(await screen.findByRole("combobox", { name: "Destination Location" }));
  await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

  await user.click(await screen.findByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));

  const quantity = await screen.findByLabelText("Quantity *");
  await user.clear(quantity);
  await user.type(quantity, "20");
}

beforeEach(() => {
  mockedFetchReceivings.mockReset();
  mockedFetchReceiving.mockReset();
  mockedFetchBalances.mockReset();
  mockedCreateReceiving.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string, query?: unknown) =>
    Promise.resolve(masterDataFor(collection, query as { locationType?: string }) as never),
  );
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);
  mockedFetchReceivings.mockResolvedValue(makePaged());
  mockedFetchBalances.mockImplementation((filters) =>
    Promise.resolve({
      items: [balanceFor(filters.locationId, 100)],
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    } satisfies PagedBalances),
  );

  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
  useReceivingHistoryFilterStore.setState({
    locationId: "",
    needleTypeId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 20,
    extra: { supplierId: "" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReceivingScreen — history", () => {
  it("refuses the history to a caller without STOCK_VIEW, and never requests it", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["STOCK_RECEIVE"] });

    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchReceivings).not.toHaveBeenCalled();
  });

  it("renders a history row with its supplier, received date, destination, reference and actor", async () => {
    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("MV-20260915-000001")).toBeInTheDocument();
    // The received date is the business day of arrival — shown as the day the
    // server sent, not shifted by the browser's zone.
    expect(screen.getByText("12 Sep 2026")).toBeInTheDocument();
    expect(await screen.findByText("SUP-ACME — Acme Needles")).toBeInTheDocument();
    expect(await screen.findByText("WH-01 — Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("DBX1 — DBx1")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("GR-00001")).toBeInTheDocument();
    // Actor resolves to a name, never a raw uuid.
    expect(await screen.findByText("Test Admin")).toBeInTheDocument();
  });

  it("says so plainly when a receiving predates the supplier field, rather than inventing one", async () => {
    mockedFetchReceivings.mockResolvedValue(makePaged({ items: [makeReceiving({ supplierId: null })] }));

    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("Not recorded")).toBeInTheDocument();
  });

  it("renders loading skeletons before the request resolves", async () => {
    let resolve!: (value: Paged<ReceivingHistoryItem>) => void;
    mockedFetchReceivings.mockReturnValue(new Promise((r) => (resolve = r)));

    renderWithQueryClient(<ReceivingScreen />);

    expect(screen.queryByText("No receivings found.")).not.toBeInTheDocument();
    expect(screen.queryByText("MV-20260915-000001")).not.toBeInTheDocument();

    resolve(makePaged());
    expect(await screen.findByText("MV-20260915-000001")).toBeInTheDocument();
  });

  it("renders an EmptyState when no receivings match", async () => {
    mockedFetchReceivings.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("No receivings found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchReceivings.mockRejectedValueOnce(new Error("network down"));
    mockedFetchReceivings.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("MV-20260915-000001")).toBeInTheDocument();
  });

  it("requests the chosen supplier, location and date range", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Supplier" }));
    await user.click(await screen.findByRole("option", { name: /Acme Needles/ }));

    await user.click(screen.getByRole("combobox", { name: "Filter by Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

    fireEvent.change(screen.getByLabelText("Date From"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Date To"), { target: { value: "2026-09-15" } });

    await vi.waitFor(() => {
      expect(mockedFetchReceivings).toHaveBeenLastCalledWith(
        expect.objectContaining({
          supplierId: "SUP-1",
          locationId: "LOC-1",
          dateFrom: "2026-09-01",
          dateTo: "2026-09-15",
        }),
      );
    });
  });

  it("resets to page 1 when a filter changes", async () => {
    const user = userEvent.setup();
    useReceivingHistoryFilterStore.setState({ page: 3 });

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Supplier" }));
    await user.click(await screen.findByRole("option", { name: /Acme Needles/ }));

    await vi.waitFor(() => {
      expect(mockedFetchReceivings).toHaveBeenLastCalledWith(
        expect.objectContaining({ supplierId: "SUP-1", page: 1 }),
      );
    });
  });

  it("opens the detail for the row that was clicked, with the note and a link into the ledger", async () => {
    const user = userEvent.setup();
    mockedFetchReceiving.mockResolvedValue(makeReceiving());

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");

    await user.click(screen.getByRole("button", { name: "View receiving MV-20260915-000001" }));

    const detail = await screen.findByRole("dialog", { name: "Receiving Detail" });
    expect(mockedFetchReceiving).toHaveBeenCalledWith("RCV-1");
    expect(within(detail).getByText("First delivery of the quarter")).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: /Open in Stock Movement/ })).toHaveAttribute(
      "href",
      "/inventory/movement?referenceId=RCV-1",
    );
  });

  it("opens the detail named by the ledger drill-through's ?id=", async () => {
    mockedFetchReceiving.mockResolvedValue(makeReceiving());

    renderWithQueryClient(<ReceivingScreen initialDetailId="RCV-1" />);

    expect(await screen.findByRole("heading", { name: "Receiving Detail" })).toBeInTheDocument();
    await vi.waitFor(() => expect(mockedFetchReceiving).toHaveBeenCalledWith("RCV-1"));
  });

  it("surfaces a detail that could not be loaded as an error, not a blank dialog", async () => {
    const notFound = new AxiosError("Not Found", "ERR_BAD_REQUEST");
    notFound.response = {
      status: 404,
      data: { success: false, error: { code: "NOT_FOUND", message: "Receiving not found: RCV-9", details: [] } },
    } as AxiosResponse;
    mockedFetchReceiving.mockRejectedValue(notFound);

    renderWithQueryClient(<ReceivingScreen initialDetailId="RCV-9" />);

    expect(await screen.findByText("Receiving not found: RCV-9")).toBeInTheDocument();
  });
});

describe("ReceivingScreen — create", () => {
  it("hides New Receiving from a caller who may read history but not receive", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["STOCK_VIEW"] });

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");

    expect(screen.queryByRole("button", { name: /New Receiving/ })).not.toBeInTheDocument();
  });

  it("asks /locations for warehouses only — a receiving lands nowhere else", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);

    await vi.waitFor(() =>
      expect(mockedFetchMasterData).toHaveBeenCalledWith("locations", {
        factoryId: "FAC-001",
        locationType: "WAREHOUSE",
      }),
    );
  });

  it("asks /suppliers with no filter — a supplier has no status and no factory", async () => {
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");

    await vi.waitFor(() => {
      expect(mockedFetchMasterData.mock.calls.some(([collection]) => collection === "suppliers")).toBe(true);
    });
    for (const [collection, query] of mockedFetchMasterData.mock.calls) {
      if (collection !== "suppliers") continue;
      expect(query ?? {}).toEqual({});
    }
  });

  it("refuses to submit a receiving with no supplier, and sends nothing", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillReceivingForm(user, { supplier: false });

    await user.click(screen.getByRole("button", { name: "Review Receiving" }));

    expect(await screen.findByText("Supplier is required")).toBeInTheDocument();
    expect(mockedCreateReceiving).not.toHaveBeenCalled();
  });

  it("refuses a future received date before any request is sent", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillReceivingForm(user);

    fireEvent.change(screen.getByLabelText("Received Date *"), { target: { value: shiftDays(1) } });
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));

    expect(await screen.findByText("Received date cannot be in the future")).toBeInTheDocument();
    expect(mockedCreateReceiving).not.toHaveBeenCalled();
  });

  it("accepts a backdated received date — that is the point of the field", async () => {
    const user = userEvent.setup();
    mockedCreateReceiving.mockResolvedValue(createdResult({ receivedDate: shiftDays(-3) }));

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillReceivingForm(user);

    fireEvent.change(screen.getByLabelText("Received Date *"), { target: { value: shiftDays(-3) } });
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));
    await screen.findByRole("heading", { name: "Confirm Receiving" });
    await user.click(screen.getByRole("button", { name: "Confirm Receiving" }));

    await vi.waitFor(() => expect(mockedCreateReceiving).toHaveBeenCalledTimes(1));
    expect(mockedCreateReceiving.mock.calls[0][0].receivedDate).toBe(shiftDays(-3));
  });

  it("reviews the balance impact, then submits the exact payload", async () => {
    const user = userEvent.setup();
    mockedCreateReceiving.mockResolvedValue(createdResult({ referenceDocument: "GR-9", note: "Pallet 3" }));

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillReceivingForm(user);

    await user.type(screen.getByLabelText("Reference Document"), "GR-9");
    await user.type(screen.getByLabelText("Note"), "Pallet 3");

    await user.click(screen.getByRole("button", { name: "Review Receiving" }));

    expect(await screen.findByRole("heading", { name: "Confirm Receiving" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm Receiving" }));

    await vi.waitFor(() => expect(mockedCreateReceiving).toHaveBeenCalledTimes(1));
    expect(mockedCreateReceiving.mock.calls[0][0]).toEqual({
      factoryId: "FAC-001",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 20,
      supplierId: "SUP-1",
      // Sent explicitly, defaulted to today by the form rather than left to
      // the server's own default.
      receivedDate: today(),
      referenceDocument: "GR-9",
      note: "Pallet 3",
    });
  });

  it("closes the form and refetches the history after a successful receiving", async () => {
    const user = userEvent.setup();
    mockedCreateReceiving.mockResolvedValue(createdResult());

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    const callsBefore = mockedFetchReceivings.mock.calls.length;

    await openCreateForm(user);
    await fillReceivingForm(user);
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));
    await screen.findByRole("heading", { name: "Confirm Receiving" });
    await user.click(screen.getByRole("button", { name: "Confirm Receiving" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("heading", { name: "New Receiving" })).not.toBeInTheDocument();
    });
    // The create mutation invalidates the whole `inventory` key space, which
    // the history list lives under.
    await vi.waitFor(() => {
      expect(mockedFetchReceivings.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it("surfaces a rejected supplier inline in the form, not as a generic toast", async () => {
    const user = userEvent.setup();
    const unknownSupplier = new AxiosError("Bad Request", "ERR_BAD_REQUEST");
    unknownSupplier.response = {
      status: 400,
      data: {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Supplier not found: SUP-1", details: [] },
      },
    } as AxiosResponse;
    mockedCreateReceiving.mockRejectedValue(unknownSupplier);

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260915-000001");
    await openCreateForm(user);
    await fillReceivingForm(user);
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));
    await screen.findByRole("heading", { name: "Confirm Receiving" });
    await user.click(screen.getByRole("button", { name: "Confirm Receiving" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Supplier not found: SUP-1/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Confirm Receiving" })).not.toBeInTheDocument();
  });
});
