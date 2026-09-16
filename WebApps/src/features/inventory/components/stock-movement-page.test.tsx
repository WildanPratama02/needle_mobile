import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useStockMovementFilterStore } from "../store";
import type { MovementItem, PagedMovements } from "../api/types";

/**
 * The ledger's Reference column drills through to the record that owns the row
 * (`.scratch/inventory-operation-history/spec.md` decision 9, superseding
 * `.scratch/inventory/spec.md` #9, which had it as plain text). Which id each
 * link carries is the part worth pinning down: Transfer/Return point at the
 * movement's `referenceId` (the operation header), an Adjustment at the row's
 * own movement id — `GET /inventory/adjustments/{id}` is keyed by the
 * ADJUSTMENT movement — and a count session at its session id.
 */

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

vi.mock("@/core/users/data-source", () => ({
  fetchAllUsers: vi.fn(),
  fetchUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

const { fetchMovements } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { StockMovementScreen } = await import("./stock-movement-page");

const mockedFetchMovements = vi.mocked(fetchMovements);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedFetchAllUsers = vi.mocked(fetchAllUsers);

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
    createdBy: "USR-000",
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
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);

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

  it("renders populated rows, with the actor resolved to a name", async () => {
    mockedFetchMovements.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByText("MV-20260820-000001")).toBeInTheDocument();
    expect(screen.getByText("DBX1 — DBx1")).toBeInTheDocument();
    expect(await screen.findByText("Test Admin")).toBeInTheDocument();
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
      }),
    );

    renderWithQueryClient(<StockMovementScreen />);

    for (const label of ["Issue", "Reversal", "Transfer Out", "Transfer In", "Adjustment", "Return"]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });

  it("leaves a reference with no detail screen as plain text", async () => {
    mockedFetchMovements.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByText("REF-1")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("drills a transfer through to its transfer detail", async () => {
    mockedFetchMovements.mockResolvedValue(
      makePaged({
        items: [makeItem({ movementType: "TRANSFER_OUT", referenceType: "TRANSFER", referenceId: "TRF-1" })],
      }),
    );

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByRole("link", { name: /Transfer/ })).toHaveAttribute(
      "href",
      "/inventory/transfer?id=TRF-1",
    );
  });

  it("drills a stock return through to its return detail", async () => {
    mockedFetchMovements.mockResolvedValue(
      makePaged({ items: [makeItem({ movementType: "RETURN", referenceType: "RETURN", referenceId: "RET-1" })] }),
    );

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByRole("link", { name: /Stock Return/ })).toHaveAttribute(
      "href",
      "/inventory/return?id=RET-1",
    );
  });

  it("drills an adjustment through on its own movement id, which is what the detail route takes", async () => {
    mockedFetchMovements.mockResolvedValue(
      makePaged({
        items: [
          makeItem({
            id: "MOV-ADJ-1",
            movementType: "ADJUSTMENT",
            referenceType: "ADJUSTMENT",
            referenceId: "MOV-ADJ-1",
          }),
        ],
      }),
    );

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByRole("link", { name: /Adjustment/ })).toHaveAttribute(
      "href",
      "/inventory/adjustment?id=MOV-ADJ-1",
    );
  });

  it("drills a count-session adjustment through to the session that wrote it", async () => {
    mockedFetchMovements.mockResolvedValue(
      makePaged({
        items: [
          makeItem({
            id: "MOV-ADJ-2",
            movementType: "ADJUSTMENT",
            referenceType: "COUNT_SESSION",
            referenceId: "CS-1",
          }),
        ],
      }),
    );

    renderWithQueryClient(<StockMovementScreen />);

    expect(await screen.findByRole("link", { name: /Physical Count/ })).toHaveAttribute(
      "href",
      "/inventory/count/CS-1",
    );
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

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(screen.getByLabelText("Date From"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("Date To"), { target: { value: "2026-08-20" } });

    await vi.waitFor(() => {
      expect(mockedFetchMovements).toHaveBeenLastCalledWith(
        expect.objectContaining({ dateFrom: "2026-08-01", dateTo: "2026-08-20" }),
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
        expect.objectContaining({ movementType: "TRANSFER_OUT", page: 1 }),
      );
    });
  });
});
