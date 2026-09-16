import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCountSessionFilterStore } from "../store";
import type { CountSession, CountSessionDetail, PagedCountSessions } from "../api/count-session-types";

/**
 * `/inventory/count` is now a session list, not a create-only form
 * (`.scratch/inventory-operation-history/spec.md` decision 6): every session
 * in scope is listed, "Start Count" opens one on the server and routes to it,
 * and a row resumes or reviews one. Count-session reads stay on `STOCK_COUNT`
 * (decision 8), so one gate covers the whole screen.
 */

const pushSpy = vi.fn();

vi.mock("../api/count-session-data-source", () => ({
  fetchCountSessions: vi.fn(),
  createCountSession: vi.fn(),
  fetchCountSession: vi.fn(),
  addCountItem: vi.fn(),
  completeCountSession: vi.fn(),
  cancelCountSession: vi.fn(),
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/inventory/count",
}));

const { fetchCountSessions, createCountSession } = await import("../api/count-session-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { CountSessionScreen } = await import("./count-session-page");

const mockedFetchSessions = vi.mocked(fetchCountSessions);
const mockedCreateSession = vi.mocked(createCountSession);
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
const LOCATION = {
  id: "LOC-1",
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
  if (collection === "locations") return [LOCATION];
  if (collection === "needle-types") return [NEEDLE_TYPE];
  return [];
}

function makeSession(overrides: Partial<CountSession> = {}): CountSession {
  return {
    id: "CS-1",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    status: "OPEN",
    createdBy: "USR-000",
    completedAt: null,
    cancelledAt: null,
    itemCount: 3,
    createdAt: "2026-09-15T08:00:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedCountSessions> = {}): PagedCountSessions {
  return { items: [makeSession()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  pushSpy.mockReset();
  mockedFetchSessions.mockReset();
  mockedCreateSession.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  // STOCK_COUNT isn't in the shared fixture's grant list.
  withPermissions([...MOCK_CURRENT_USER.permissions, "STOCK_COUNT"]);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);
  mockedFetchSessions.mockResolvedValue(makePaged());

  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
  useCountSessionFilterStore.setState({
    locationId: "",
    needleTypeId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 20,
    extra: { status: "OPEN" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CountSessionScreen", () => {
  it("refuses the screen to a caller without STOCK_COUNT, and never requests the list", async () => {
    withPermissions(["STOCK_VIEW"]);

    renderWithQueryClient(<CountSessionScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchSessions).not.toHaveBeenCalled();
  });

  it("lands on the open sessions, so an unfinished count is the first thing offered", async () => {
    renderWithQueryClient(<CountSessionScreen />);

    // Wait for the row, not the tab: "Open" is also a tab label, and it
    // renders before the session request has even been allowed to fire.
    await screen.findByText("TRL-A-01 — Trolley A-01");
    expect(mockedFetchSessions).toHaveBeenCalledWith(expect.objectContaining({ status: "OPEN" }));
  });

  it("renders a session row with its location type, status, items counted and counter", async () => {
    renderWithQueryClient(<CountSessionScreen />);

    expect(await screen.findByText("TRL-A-01 — Trolley A-01")).toBeInTheDocument();
    // The location's type, so a trolley is recognisable at a glance.
    expect(screen.getByText("Trolley")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(await screen.findByText("Test Admin")).toBeInTheDocument();
  });

  it("shows when a closed session was completed, and when one was cancelled", async () => {
    mockedFetchSessions.mockResolvedValue(
      makePaged({
        items: [
          makeSession({
            id: "CS-2",
            status: "CANCELLED",
            cancelledAt: "2026-09-15T10:00:00.000Z",
            itemCount: 1,
          }),
        ],
      }),
    );

    renderWithQueryClient(<CountSessionScreen />);

    // The row's own cancelled timestamp — "Cancelled" alone would match the tab.
    expect(await screen.findByText("15 Sep 2026, 17:00")).toBeInTheDocument();
    // Tab and status badge both, so the row really is badged Cancelled.
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThan(1);
  });

  it("filters by status from the tabs, including the new Cancelled one", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CountSessionScreen />);
    await screen.findByText("TRL-A-01 — Trolley A-01");

    await user.click(screen.getByRole("tab", { name: "Cancelled" }));

    await vi.waitFor(() => {
      expect(mockedFetchSessions).toHaveBeenLastCalledWith(expect.objectContaining({ status: "CANCELLED" }));
    });

    await user.click(screen.getByRole("tab", { name: "All" }));

    await vi.waitFor(() => {
      expect(mockedFetchSessions).toHaveBeenLastCalledWith(expect.objectContaining({ status: "ALL" }));
    });
  });

  it("requests the chosen location", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CountSessionScreen />);
    await screen.findByText("TRL-A-01 — Trolley A-01");

    await user.click(screen.getByRole("combobox", { name: "Filter by Location" }));
    await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

    await vi.waitFor(() => {
      expect(mockedFetchSessions).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: "LOC-1", page: 1 }));
    });
  });

  it("renders an EmptyState when nothing is open", async () => {
    mockedFetchSessions.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<CountSessionScreen />);

    expect(await screen.findByText("No open count sessions.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchSessions.mockRejectedValueOnce(new Error("network down"));
    mockedFetchSessions.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<CountSessionScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("TRL-A-01 — Trolley A-01")).toBeInTheDocument();
  });

  it("opens a session's own route from its row, so a refresh resumes it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CountSessionScreen />);

    await user.click(await screen.findByRole("link", { name: /Trolley A-01/ }));

    expect(pushSpy).toHaveBeenCalledWith("/inventory/count/CS-1");
  });

  it("starts a session server-side with factory + location, then opens its route", async () => {
    const user = userEvent.setup();
    mockedCreateSession.mockResolvedValue({
      id: "CS-9",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      status: "OPEN",
      createdBy: "USR-000",
      completedAt: null,
      cancelledAt: null,
      itemCount: 0,
      createdAt: "2026-09-16T00:00:00.000Z",
      items: [],
      adjustments: [],
    } satisfies CountSessionDetail);

    renderWithQueryClient(<CountSessionScreen />);
    await screen.findByText("TRL-A-01 — Trolley A-01");

    await user.click(screen.getByRole("button", { name: /Start Count/ }));
    await screen.findByRole("heading", { name: "Start Count Session" });

    await user.click(screen.getByRole("combobox", { name: "Location" }));
    await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));
    await user.click(screen.getByRole("button", { name: "Start Session" }));

    await vi.waitFor(() => expect(mockedCreateSession).toHaveBeenCalledTimes(1));
    expect(mockedCreateSession.mock.calls[0][0]).toEqual({ factoryId: "FAC-001", locationId: "LOC-1" });
    await vi.waitFor(() => expect(pushSpy).toHaveBeenCalledWith("/inventory/count/CS-9"));
  });
});
