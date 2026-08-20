import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useStockMovementFilterStore } from "../store";
import type { MovementItem, PagedMovements } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchMovements: vi.fn(),
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

const { fetchMovements } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { StockMovementScreen } = await import("./stock-movement-page");

const mockedFetchMovements = vi.mocked(fetchMovements);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

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
const LOCATION = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
  parentLocationId: null,
};

function masterDataFor(collection: string) {
  if (collection === "needle-types") return [NEEDLE_TYPE];
  if (collection === "locations") return [LOCATION];
  return [];
}

function makeItem(overrides: Partial<MovementItem> = {}): MovementItem {
  return {
    id: "MOV-1",
    movementNumber: "MV-20260820-000001",
    movementType: "RECEIVING",
    factoryId: "FAC-001",
    sourceLocationId: null,
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 100,
    referenceType: "RECEIVING",
    referenceId: "REF-1",
    reason: "Initial stock",
    createdBy: "USR-001",
    createdAt: "2026-08-10T08:30:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedMovements> = {}): PagedMovements {
  return { items: [makeItem()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

beforeEach(() => {
  mockedFetchMovements.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  useSessionBootstrapStore.setState({ ready: true });
  useStockMovementFilterStore.setState({
    locationId: "",
    trolleyId: "",
    needleTypeId: "",
    movementType: "ALL",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 20,
  });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StockMovementScreen", () => {
  it("refuses the screen to a caller without STOCK_VIEW", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchMovements).not.toHaveBeenCalled();
  });

  it("renders populated rows with referenceType/referenceId as plain text", async () => {
    mockedFetchMovements.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByText("MV-20260820-000001")).toBeInTheDocument();
    expect(screen.getByText("Receiving")).toBeInTheDocument();
    expect(screen.getByText("RECEIVING")).toBeInTheDocument();
    expect(screen.getByText("REF-1")).toBeInTheDocument();
    // Plain text, not a link — spec decision #9, no drill-through.
    expect(screen.queryByRole("link", { name: /REF-1/ })).not.toBeInTheDocument();
  });

  it("renders every movement type correctly, including ISSUE/REVERSAL originating from Exchange", async () => {
    mockedFetchMovements.mockResolvedValue(
      makePaged({
        items: [
          makeItem({ id: "MOV-1", movementType: "ISSUE" }),
          makeItem({ id: "MOV-2", movementType: "REVERSAL" }),
          makeItem({ id: "MOV-3", movementType: "TRANSFER_OUT" }),
          makeItem({ id: "MOV-4", movementType: "TRANSFER_IN" }),
          makeItem({ id: "MOV-5", movementType: "ADJUSTMENT" }),
          makeItem({ id: "MOV-6", movementType: "RETURN" }),
        ],
        total: 6,
      })
    );

    renderWithQueryClient(<StockMovementScreen />);

    for (const label of ["Issue", "Reversal", "Transfer Out", "Transfer In", "Adjustment", "Return"]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });

  it("renders an EmptyState when there are no rows", async () => {
    mockedFetchMovements.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByText("No stock movements found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchMovements.mockRejectedValueOnce(new Error("network down"));
    mockedFetchMovements.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("MV-20260820-000001")).toBeInTheDocument();
  });

  it("requests the selected movement type", async () => {
    const user = userEvent.setup();
    mockedFetchMovements.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockMovementScreen />);
    await screen.findByText("MV-20260820-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Movement Type" }));
    await user.click(await screen.findByRole("option", { name: "Adjustment" }));

    await vi.waitFor(() => {
      expect(mockedFetchMovements).toHaveBeenLastCalledWith(expect.objectContaining({ movementType: "ADJUSTMENT" }));
    });
  });

  it("requests the given date range", async () => {
    mockedFetchMovements.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockMovementScreen />);
    await screen.findByText("MV-20260820-000001");

    const dateFrom = screen.getByLabelText("Date From");
    const dateTo = screen.getByLabelText("Date To");

    // fireEvent avoids userEvent's per-character typing semantics for native date inputs.
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(dateFrom, { target: { value: "2026-08-01" } });
    fireEvent.change(dateTo, { target: { value: "2026-08-20" } });

    await vi.waitFor(() => {
      expect(mockedFetchMovements).toHaveBeenLastCalledWith(
        expect.objectContaining({ dateFrom: "2026-08-01", dateTo: "2026-08-20" })
      );
    });
  });

  it("resets to page 1 when a filter changes", async () => {
    const user = userEvent.setup();
    useStockMovementFilterStore.setState({ page: 3 });
    mockedFetchMovements.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockMovementScreen />);
    await screen.findByText("MV-20260820-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Movement Type" }));
    await user.click(await screen.findByRole("option", { name: "Transfer Out" }));

    await vi.waitFor(() => {
      expect(mockedFetchMovements).toHaveBeenLastCalledWith(
        expect.objectContaining({ movementType: "TRANSFER_OUT", page: 1 })
      );
    });
  });
});
