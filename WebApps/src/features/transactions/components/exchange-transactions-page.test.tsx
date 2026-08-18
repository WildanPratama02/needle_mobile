import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useTransactionsFilterStore } from "../store";
import type { ExchangeListItem, PagedExchanges } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchExchanges: vi.fn(),
}));

// Reference data goes through the same seam every other data layer uses: mock
// the data-source, let the real lookup hooks and cache run.
vi.mock("@/core/master-data/data-source", () => ({
  fetchMasterData: vi.fn(),
  fetchMasterDataRow: vi.fn(),
}));

// The screen is gated on EXCHANGE_VIEW now, so it needs a real session to
// render at all — same seam, mock the data-source and let `useCurrentUser` run.
vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

// DataTable's row-navigation (getRowHref) needs an App Router context that
// doesn't exist in jsdom; Sidebar's usePathname tolerates this environment
// fine on its own, but useRouter throws without a mock.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/transactions/exchange",
}));

const { fetchExchanges } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { ExchangeTransactionsScreen } = await import("./exchange-transactions-page");
const mockedFetchExchanges = vi.mocked(fetchExchanges);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const TROLLEY_A = {
  id: "TRL-001",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationId: "LOC-001",
};
const TROLLEY_B = { ...TROLLEY_A, id: "TRL-002", code: "TRL-A-02", name: "Trolley A-02" };
const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE" as const,
  description: null,
  timezone: "Asia/Jakarta",
};

/** Routes each collection to its own fixture, the way the real endpoint would. */
function masterDataFor(collection: string) {
  if (collection === "trolleys") return [TROLLEY_A, TROLLEY_B];
  if (collection === "factories") return [FACTORY];
  return [];
}

function makeItem(overrides: Partial<ExchangeListItem> = {}): ExchangeListItem {
  return {
    id: "EX-1",
    exchangeNumber: "EXC-20260810-000001",
    status: "COMPLETED",
    factoryId: "FAC-001",
    trolleyId: "TRL-001",
    deviceId: "DEV-001",
    operatorId: null,
    exchangeTypeId: null,
    exchangeTypeCode: null,
    exchangeTypeName: null,
    oldNeedleTypeId: null,
    newNeedleTypeId: null,
    fragmentStatus: null,
    confirmationId: null,
    createdAt: "2026-08-10T08:30:00.000Z",
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedExchanges> = {}): PagedExchanges {
  return {
    items: [makeItem()],
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
    requestId: "REQ-1",
    ...overrides,
  };
}

beforeEach(() => {
  mockedFetchExchanges.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) =>
    Promise.resolve(masterDataFor(collection) as never)
  );
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  useSessionBootstrapStore.setState({ ready: true });
  useTransactionsFilterStore.setState({ trolleyId: "", status: "ALL", page: 1, pageSize: 20 });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExchangeTransactionsScreen", () => {
  it("renders populated rows", async () => {
    mockedFetchExchanges.mockResolvedValue(
      makePaged({
        items: [
          makeItem({ id: "EX-1", exchangeNumber: "EXC-20260810-000001", status: "COMPLETED" }),
          makeItem({ id: "EX-2", exchangeNumber: "EXC-20260810-000002", status: "NEEDLE_ISSUED" }),
        ],
        total: 2,
      })
    );

    renderWithQueryClient(<ExchangeTransactionsScreen />);

    expect(await screen.findByText("EXC-20260810-000001")).toBeInTheDocument();
    expect(screen.getByText("EXC-20260810-000002")).toBeInTheDocument();
  });

  it("renders an EmptyState when there are no rows", async () => {
    mockedFetchExchanges.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<ExchangeTransactionsScreen />);

    expect(await screen.findByText("No exchange transactions found.")).toBeInTheDocument();
  });

  it("renders loading skeletons before the request resolves", async () => {
    let resolve!: (value: PagedExchanges) => void;
    mockedFetchExchanges.mockReturnValue(new Promise((r) => (resolve = r)));

    renderWithQueryClient(<ExchangeTransactionsScreen />);

    expect(screen.queryByText("No exchange transactions found.")).not.toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);

    resolve(makePaged());
    expect(await screen.findByText("EXC-20260810-000001")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchExchanges.mockRejectedValueOnce(new Error("network down"));
    mockedFetchExchanges.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("EXC-20260810-000001")).toBeInTheDocument();
    expect(mockedFetchExchanges).toHaveBeenCalledTimes(2);
  });

  it("renders the real ExchangeState label via StatusBadge", async () => {
    mockedFetchExchanges.mockResolvedValue(makePaged({ items: [makeItem({ status: "NEEDLE_ISSUED" })] }));

    renderWithQueryClient(<ExchangeTransactionsScreen />);

    expect(await screen.findByText("Needle Issued")).toBeInTheDocument();
  });

  it("requests the new status when the Status filter changes", async () => {
    const user = userEvent.setup();
    mockedFetchExchanges.mockResolvedValue(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Status" }));
    await user.click(await screen.findByRole("option", { name: "Completed" }));

    await vi.waitFor(() => {
      expect(mockedFetchExchanges).toHaveBeenLastCalledWith(expect.objectContaining({ status: "COMPLETED" }));
    });
  });

  /**
   * The trolley filter used to be a free-text box sending whatever was typed
   * to a `@IsUUID()` parameter, so any real trolley code produced a 400. It is
   * a select over the real trolley list now, which is why this asserts on the
   * id sent rather than on typed text.
   */
  it("sends the selected trolley's id when the Trolley filter changes", async () => {
    const user = userEvent.setup();
    mockedFetchExchanges.mockResolvedValue(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Trolley" }));
    await user.click(await screen.findByRole("option", { name: /TRL-A-02/ }));

    await vi.waitFor(
      () => {
        expect(mockedFetchExchanges).toHaveBeenLastCalledWith(
          expect.objectContaining({ trolleyId: "TRL-002" })
        );
      },
      { timeout: 2000 }
    );
  });

  it("offers an option that clears the trolley filter", async () => {
    const user = userEvent.setup();
    useTransactionsFilterStore.setState({ trolleyId: "TRL-001" });
    mockedFetchExchanges.mockResolvedValue(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Trolley" }));
    await user.click(await screen.findByRole("option", { name: "All Trolleys" }));

    await vi.waitFor(() => {
      expect(mockedFetchExchanges).toHaveBeenLastCalledWith(
        expect.objectContaining({ trolleyId: "" })
      );
    });
  });

  it("clears the trolley selection when the factory scope moves", async () => {
    useTransactionsFilterStore.setState({ trolleyId: "TRL-001" });
    mockedFetchExchanges.mockResolvedValue(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-002" });

    // A trolley belongs to one factory, so keeping the selection would filter
    // to a trolley that cannot appear under the new scope.
    await vi.waitFor(() => {
      expect(mockedFetchExchanges).toHaveBeenLastCalledWith(
        expect.objectContaining({ factoryId: "FAC-002", trolleyId: "" })
      );
    });
  });

  it("resolves trolley and factory ids to names in the table", async () => {
    mockedFetchExchanges.mockResolvedValue(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);

    expect(await screen.findByText("TRL-A-01 — Trolley A-01")).toBeInTheDocument();
    expect(await screen.findByText("Bandung Plant")).toBeInTheDocument();
  });

  /**
   * The fallback matters more than the happy path: a reader must be able to
   * tell an unresolved reference from a real name, and must never be shown a
   * label the client invented from an id.
   */
  it("falls back to the raw id when a name cannot be resolved", async () => {
    mockedFetchMasterData.mockImplementation(() => Promise.resolve([] as never));
    mockedFetchExchanges.mockResolvedValue(makePaged());

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    expect(await screen.findByText("TRL-001")).toBeInTheDocument();
    expect(screen.queryByText("Trolley A-01")).not.toBeInTheDocument();
  });

  describe("permission gate", () => {
    it("refuses the screen to a caller without EXCHANGE_VIEW", async () => {
      mockedFetchCurrentUser.mockResolvedValue({
        ...MOCK_CURRENT_USER,
        permissions: ["DASHBOARD_VIEW"],
      });

      renderWithQueryClient(<ExchangeTransactionsScreen />);

      expect(
        await screen.findByText("You do not have access to this resource.")
      ).toBeInTheDocument();
      // No request is sent that is already known to be refused.
      expect(mockedFetchExchanges).not.toHaveBeenCalled();
    });

    /**
     * Client-side hiding is UX; the backend is the boundary. A grant revoked
     * after the page loaded leaves a stale client answer, and the server's 403
     * must still land on the same treatment.
     */
    it("shows access denied when the server refuses despite a permitted client", async () => {
      const forbidden = new AxiosError("Forbidden", "ERR_BAD_REQUEST");
      forbidden.response = { status: 403, data: {} } as AxiosResponse;
      mockedFetchExchanges.mockRejectedValue(forbidden);

      renderWithQueryClient(<ExchangeTransactionsScreen />);

      expect(
        await screen.findByText("You do not have access to this resource.")
      ).toBeInTheDocument();
    });
  });

  describe("exchange type", () => {
    it("renders the name that came with the row", async () => {
      mockedFetchExchanges.mockResolvedValue(
        makePaged({
          items: [makeItem({ exchangeTypeCode: "BROKEN", exchangeTypeName: "Broken Needle" })],
        })
      );

      renderWithQueryClient(<ExchangeTransactionsScreen />);

      expect(await screen.findByText("Broken Needle")).toBeInTheDocument();
    });

    /**
     * The backend projects these labels from a relation it already loads, so
     * resolving them through the reference-data lookup would be a second fetch
     * for data the response already carried.
     */
    it("never fetches the exchange-type catalogue to render them", async () => {
      mockedFetchExchanges.mockResolvedValue(
        makePaged({
          items: [makeItem({ exchangeTypeCode: "BROKEN", exchangeTypeName: "Broken Needle" })],
        })
      );

      renderWithQueryClient(<ExchangeTransactionsScreen />);
      await screen.findByText("Broken Needle");

      const collections = mockedFetchMasterData.mock.calls.map(([collection]) => collection);
      expect(collections).not.toContain("exchange-types");
      // The lookups whose relations are not projected still run.
      expect(collections).toContain("trolleys");
    });

    it("shows a dash before a type has been selected", async () => {
      mockedFetchExchanges.mockResolvedValue(
        makePaged({ items: [makeItem({ exchangeTypeCode: null, exchangeTypeName: null })] })
      );

      renderWithQueryClient(<ExchangeTransactionsScreen />);
      await screen.findByText("EXC-20260810-000001");

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });
  });

  it("fetches each collection once however many rows reference it", async () => {
    mockedFetchExchanges.mockResolvedValue(
      makePaged({
        items: [
          makeItem({ id: "EX-1", exchangeNumber: "EXC-20260810-000001" }),
          makeItem({ id: "EX-2", exchangeNumber: "EXC-20260810-000002" }),
          makeItem({ id: "EX-3", exchangeNumber: "EXC-20260810-000003" }),
        ],
        total: 3,
      })
    );

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000003");

    await vi.waitFor(() => {
      const trolleyCalls = mockedFetchMasterData.mock.calls.filter(([c]) => c === "trolleys");
      expect(trolleyCalls).toHaveLength(1);
    });
  });

  it("resets to page 1 when a filter changes", async () => {
    const user = userEvent.setup();
    useTransactionsFilterStore.setState({ page: 3 });
    mockedFetchExchanges.mockResolvedValue(makePaged({ page: 1 }));

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    await user.click(screen.getByRole("combobox", { name: "Filter by Status" }));
    await user.click(await screen.findByRole("option", { name: "Cancelled" }));

    await vi.waitFor(() => {
      expect(mockedFetchExchanges).toHaveBeenLastCalledWith(expect.objectContaining({ status: "CANCELLED", page: 1 }));
    });
  });

  it("requests the next page and preserves the active filters", async () => {
    const user = userEvent.setup();
    useTransactionsFilterStore.setState({ status: "COMPLETED" });
    mockedFetchExchanges.mockResolvedValue(makePaged({ page: 1, totalPages: 3, total: 50 }));

    renderWithQueryClient(<ExchangeTransactionsScreen />);
    await screen.findByText("EXC-20260810-000001");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    await vi.waitFor(() => {
      expect(mockedFetchExchanges).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, status: "COMPLETED" })
      );
    });
  });
});

describe("ExchangeTransactionsScreen + TopBar (no duplicate Factory selector)", () => {
  it("renders exactly one Factory selector, inside TopBar", async () => {
    mockedFetchExchanges.mockResolvedValue(makePaged());
    const { AppShell } = await import("@/shared/components/app-shell");

    renderWithQueryClient(
      <AppShell>
        <ExchangeTransactionsScreen />
      </AppShell>
    );

    await screen.findByText("EXC-20260810-000001");
    expect(screen.getAllByText("All Factories")).toHaveLength(1);
  });
});
