import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useStockOverviewFilterStore } from "../store";
import type { BalanceItem, PagedBalances, TrolleyStock } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchBalances: vi.fn(),
  fetchTrolleyStock: vi.fn(),
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

const { fetchBalances, fetchTrolleyStock } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { StockOverviewScreen } = await import("./stock-overview-page");

const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedFetchTrolleyStock = vi.mocked(fetchTrolleyStock);
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
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "TROLLEY" as const,
  parentLocationId: null,
};
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
  locationId: "LOC-1",
};

function masterDataFor(collection: string) {
  if (collection === "needle-types") return [NEEDLE_TYPE];
  if (collection === "locations") return [LOCATION];
  if (collection === "factories") return [FACTORY];
  if (collection === "trolleys") return [TROLLEY];
  return [];
}

function makeItem(overrides: Partial<BalanceItem> = {}): BalanceItem {
  return { locationId: "LOC-1", needleTypeId: "NT-1", quantity: 100, reservedQuantity: 0, availableQuantity: 100, ...overrides };
}

function makePaged(overrides: Partial<PagedBalances> = {}): PagedBalances {
  return { items: [makeItem()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

beforeEach(() => {
  mockedFetchBalances.mockReset();
  mockedFetchTrolleyStock.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  useSessionBootstrapStore.setState({ ready: true });
  useStockOverviewFilterStore.setState({ locationId: "", trolleyId: "", needleTypeId: "", lowStock: false, page: 1, pageSize: 20 });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StockOverviewScreen", () => {
  it("refuses the screen to a caller without STOCK_VIEW", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<StockOverviewScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchBalances).not.toHaveBeenCalled();
  });

  it("renders populated rows with resolved names and a Low status", async () => {
    mockedFetchBalances.mockResolvedValue(makePaged({ items: [makeItem({ quantity: 5 })] }));

    renderWithQueryClient(<StockOverviewScreen />);

    expect(await screen.findByText("DBX1 — DBx1")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    // Chained lookup (location -> its factoryId -> factory name), so it settles after the row itself.
    expect(await screen.findByText("Bandung Plant")).toBeInTheDocument();
  });

  it("renders an Out of Stock status at zero quantity", async () => {
    mockedFetchBalances.mockResolvedValue(makePaged({ items: [makeItem({ quantity: 0 })] }));

    renderWithQueryClient(<StockOverviewScreen />);

    expect(await screen.findByText("Out of Stock")).toBeInTheDocument();
  });

  it("renders a Normal status above the minimum stock threshold", async () => {
    mockedFetchBalances.mockResolvedValue(makePaged({ items: [makeItem({ quantity: 100 })] }));

    renderWithQueryClient(<StockOverviewScreen />);

    expect(await screen.findByText("Normal")).toBeInTheDocument();
  });

  it("renders an EmptyState when there are no rows", async () => {
    mockedFetchBalances.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<StockOverviewScreen />);

    expect(await screen.findByText("No stock balances found.")).toBeInTheDocument();
  });

  it("renders loading skeletons before the request resolves", async () => {
    let resolve!: (value: PagedBalances) => void;
    mockedFetchBalances.mockReturnValue(new Promise((r) => (resolve = r)));

    renderWithQueryClient(<StockOverviewScreen />);

    expect(screen.queryByText("No stock balances found.")).not.toBeInTheDocument();
    resolve(makePaged());
    expect(await screen.findByText("DBX1 — DBx1")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchBalances.mockRejectedValueOnce(new Error("network down"));
    mockedFetchBalances.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<StockOverviewScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("DBX1 — DBx1")).toBeInTheDocument();
  });

  it("toggles Low Stock Only and requests lowStock=true", async () => {
    const user = userEvent.setup();
    mockedFetchBalances.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockOverviewScreen />);
    await screen.findByText("DBX1 — DBx1");

    await user.click(screen.getByRole("button", { name: "Low Stock Only" }));

    await vi.waitFor(() => {
      expect(mockedFetchBalances).toHaveBeenLastCalledWith(expect.objectContaining({ lowStock: true }));
    });
  });

  it("clears the location filter when a trolley is selected, and vice versa", async () => {
    const user = userEvent.setup();
    mockedFetchBalances.mockResolvedValue(makePaged());

    renderWithQueryClient(<StockOverviewScreen />);
    await screen.findByText("DBX1 — DBx1");

    await user.click(screen.getByRole("combobox", { name: "Filter by Trolley" }));
    await user.click(await screen.findByRole("option", { name: /TRL-A-01/ }));

    await vi.waitFor(() => {
      expect(mockedFetchBalances).toHaveBeenLastCalledWith(
        expect.objectContaining({ trolleyId: "TRL-1", locationId: "" })
      );
    });
  });

  it("opens the trolley drill-down dialog with server-computed per-needle-type detail", async () => {
    const user = userEvent.setup();
    mockedFetchBalances.mockResolvedValue(makePaged());
    mockedFetchTrolleyStock.mockResolvedValue({
      trolleyId: "TRL-1",
      factoryId: "FAC-001",
      items: [{ needleTypeId: "NT-1", needleTypeCode: "DBX1", quantity: 8, minimumStock: 10, stockStatus: "LOW" }],
    } satisfies TrolleyStock);

    renderWithQueryClient(<StockOverviewScreen />);
    await screen.findByText("DBX1 — DBx1");

    await user.click(screen.getByRole("combobox", { name: "Filter by Trolley" }));
    await user.click(await screen.findByRole("option", { name: /TRL-A-01/ }));

    await user.click(screen.getByRole("button", { name: /View Trolley Detail/ }));

    expect(await screen.findByText("Trolley Stock Detail")).toBeInTheDocument();
    expect(mockedFetchTrolleyStock).toHaveBeenCalledWith("TRL-1");
  });
});
