import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { BalanceItem, MovementItem, PagedBalances, PagedMovements, ReceivingResult } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchBalances: vi.fn(),
  fetchMovements: vi.fn(),
  createReceiving: vi.fn(),
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

const { fetchBalances, fetchMovements, createReceiving } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { ReceivingScreen } = await import("./receiving-page");

const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedFetchMovements = vi.mocked(fetchMovements);
const mockedCreateReceiving = vi.mocked(createReceiving);
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
const LOCATION = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
  parentLocationId: null,
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

/**
 * Stands in for the endpoint, `locationType` included: `GET /locations`
 * applies it server-side (ticket 02), so a picker that forgot to send it would
 * be caught here — it would be offered the trolley and the used-needle bin the
 * backend now refuses as a receiving destination (ticket 03).
 */
function masterDataFor(collection: string, query: { locationType?: string } = {}) {
  if (collection === "factories") return [FACTORY];
  if (collection === "locations") {
    const rows = [LOCATION, TROLLEY_LOCATION, USED_NEEDLE_LOCATION];
    return query.locationType ? rows.filter((row) => row.locationType === query.locationType) : rows;
  }
  if (collection === "needle-types") return [NEEDLE_TYPE];
  return [];
}

function makeBalancePaged(overrides: Partial<PagedBalances> = {}): PagedBalances {
  const item: BalanceItem = { locationId: "LOC-1", needleTypeId: "NT-1", quantity: 50, reservedQuantity: 0, availableQuantity: 50 };
  return { items: [item], page: 1, pageSize: 1, total: 1, totalPages: 1, ...overrides };
}

function makeMovementsPaged(overrides: Partial<PagedMovements> = {}): PagedMovements {
  const item: MovementItem = {
    id: "MOV-1",
    movementNumber: "MV-20260820-000001",
    movementType: "RECEIVING",
    factoryId: "FAC-001",
    sourceLocationId: null,
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 50,
    referenceType: "RECEIVING",
    referenceId: "REF-1",
    reason: null,
    createdBy: "USR-001",
    createdAt: "2026-08-10T08:30:00.000Z",
  };
  return { items: [item], page: 1, pageSize: 10, total: 1, totalPages: 1, ...overrides };
}

async function fillReceivingForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Factory" }));
  await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

  await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
  await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

  await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));

  const quantity = screen.getByLabelText("Quantity *");
  await user.clear(quantity);
  await user.type(quantity, "100");
}

beforeEach(() => {
  mockedFetchBalances.mockReset();
  mockedFetchMovements.mockReset();
  mockedCreateReceiving.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string, query) =>
    Promise.resolve(masterDataFor(collection, query as { locationType?: string }) as never),
  );
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchMovements.mockResolvedValue(makeMovementsPaged());
  mockedFetchBalances.mockResolvedValue(makeBalancePaged());
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReceivingScreen", () => {
  it("refuses the screen to a caller without STOCK_RECEIVE", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
  });

  it("renders the recent receivings list", async () => {
    renderWithQueryClient(<ReceivingScreen />);

    expect(await screen.findByText("MV-20260820-000001")).toBeInTheDocument();
  });

  it("asks /locations for warehouses only, so the backend's 400 stays a backstop", async () => {
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    // The narrowing is the endpoint's (ticket 02), not a pass over a fetched
    // collection: a factory with more locations than the lookup pulls would
    // otherwise silently drop the warehouses.
    await vi.waitFor(() => {
      expect(mockedFetchMasterData).toHaveBeenCalledWith("locations", {
        factoryId: "FAC-001",
        locationType: "WAREHOUSE",
      });
    });
    expect(mockedFetchMasterData).not.toHaveBeenCalledWith("locations", { factoryId: "FAC-001" });
  });

  it("offers no trolley and no used-needle bin as a destination", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    await user.click(screen.getByRole("combobox", { name: "Destination Location" }));

    expect(await screen.findByRole("option", { name: /Main Warehouse/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Trolley A-01/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Used Needle Storage/ })).not.toBeInTheDocument();
  });

  it("labels the picker for the one destination a receiving may have", async () => {
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    expect(screen.getByText("Destination Warehouse *")).toBeInTheDocument();
  });

  it("blocks submit and shows inline errors when required fields are missing", async () => {
    const user = userEvent.setup();
    // No factory scoped yet — the form's own Factory field starts genuinely empty.
    useFactoryScopeStore.setState({ selectedFactoryId: "all" });
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    await user.click(screen.getByRole("button", { name: "Review Receiving" }));

    expect(await screen.findByText("Factory is required")).toBeInTheDocument();
    expect(mockedCreateReceiving).not.toHaveBeenCalled();
  });

  it("shows the ConfirmDialog with the balance impact before submitting", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    await fillReceivingForm(user);
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Confirm Receiving" })).toBeInTheDocument();
    expect(within(dialog).getByText("50")).toBeInTheDocument(); // Current Balance
    expect(within(dialog).getByText("+100")).toBeInTheDocument(); // Receive
    expect(within(dialog).getByText("150")).toBeInTheDocument(); // New Balance
    expect(mockedCreateReceiving).not.toHaveBeenCalled();
  });

  it("submits the receiving with the exact payload on confirm", async () => {
    const user = userEvent.setup();
    mockedCreateReceiving.mockResolvedValue({
      movementId: "MOV-2",
      movementNumber: "MV-20260820-000002",
      factoryId: "FAC-001",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 100,
      balanceQuantity: 150,
      createdAt: "2026-08-20T08:30:00.000Z",
    } satisfies ReceivingResult);

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    await fillReceivingForm(user);
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Confirm Receiving" }));

    await vi.waitFor(() => {
      expect(mockedCreateReceiving).toHaveBeenCalled();
    });
    expect(mockedCreateReceiving.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        factoryId: "FAC-001",
        destinationLocationId: "LOC-1",
        needleTypeId: "NT-1",
        quantity: 100,
      })
    );
    expect(mockedCreateReceiving).toHaveBeenCalledTimes(1);
  });

  it("disables the Confirm button while the request is in flight, guarding against a duplicate submit", async () => {
    const user = userEvent.setup();
    let resolve!: (value: ReceivingResult) => void;
    mockedCreateReceiving.mockReturnValue(new Promise((r) => (resolve = r)));

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    await fillReceivingForm(user);
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));
    await screen.findByRole("dialog");

    const confirmButton = screen.getByRole("button", { name: "Confirm Receiving" });
    await user.click(confirmButton);

    expect(mockedCreateReceiving).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Processing…" })).toBeDisabled();

    resolve({
      movementId: "MOV-2",
      movementNumber: "MV-20260820-000002",
      factoryId: "FAC-001",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 100,
      balanceQuantity: 150,
      createdAt: "2026-08-20T08:30:00.000Z",
    });
  });

  it("surfaces a 400 validation error from the backend in the form, not a generic toast", async () => {
    const user = userEvent.setup();
    const badRequest = new AxiosError("Bad Request", "ERR_BAD_REQUEST");
    badRequest.response = {
      status: 400,
      data: { success: false, error: { code: "VALIDATION_ERROR", message: "quantity must be a positive number", details: [] } },
    } as AxiosResponse;
    mockedCreateReceiving.mockRejectedValue(badRequest);

    renderWithQueryClient(<ReceivingScreen />);
    await screen.findByText("MV-20260820-000001");

    await fillReceivingForm(user);
    await user.click(screen.getByRole("button", { name: "Review Receiving" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Confirm Receiving" }));

    await vi.waitFor(() => {
      expect(mockedCreateReceiving).toHaveBeenCalledTimes(1);
    });
    // The dialog closes back to the form after a failed submit, and the
    // backend's real message renders inline in the form — not a generic toast.
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(await screen.findByText("quantity must be a positive number")).toBeInTheDocument();
  });
});
