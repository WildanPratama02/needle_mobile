import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type {
  CompleteCountSessionResult,
  CountSessionDetail,
} from "../api/count-session-types";
import type { BalanceItem, PagedBalances } from "../api/types";

/**
 * `/inventory/count/[id]` — one session, read from the server, so a refresh
 * resumes an open count instead of losing it
 * (`.scratch/inventory-operation-history/spec.md` decision 6). The two rules
 * this screen has to get right: Cancel really cancels server-side rather than
 * clearing the screen, and a closed session is read-only.
 */

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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/inventory/count/CS-1",
}));

const { fetchCountSession, addCountItem, completeCountSession, cancelCountSession } = await import(
  "../api/count-session-data-source"
);
const { fetchBalances } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { CountSessionDetailScreen } = await import("./count-session-detail-page");

const mockedFetchSession = vi.mocked(fetchCountSession);
const mockedAddItem = vi.mocked(addCountItem);
const mockedComplete = vi.mocked(completeCountSession);
const mockedCancel = vi.mocked(cancelCountSession);
const mockedFetchBalances = vi.mocked(fetchBalances);
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
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
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

function makeSession(overrides: Partial<CountSessionDetail> = {}): CountSessionDetail {
  return {
    id: "CS-1",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    status: "OPEN",
    createdBy: "USR-000",
    completedAt: null,
    cancelledAt: null,
    itemCount: 0,
    createdAt: "2026-09-15T08:00:00.000Z",
    items: [],
    adjustments: [],
    ...overrides,
  };
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedFetchSession.mockReset();
  mockedAddItem.mockReset();
  mockedComplete.mockReset();
  mockedCancel.mockReset();
  mockedFetchBalances.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  withPermissions([...MOCK_CURRENT_USER.permissions, "STOCK_COUNT"]);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);
  mockedFetchSession.mockResolvedValue(makeSession());
  mockedFetchBalances.mockImplementation(() => {
    const item: BalanceItem = {
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 90,
      reservedQuantity: 0,
      availableQuantity: 90,
    };
    return Promise.resolve({ items: [item], page: 1, pageSize: 1, total: 1, totalPages: 1 } satisfies PagedBalances);
  });

  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CountSessionDetailScreen — open session", () => {
  it("refuses the session to a caller without STOCK_COUNT, and never requests it", async () => {
    withPermissions(["STOCK_VIEW"]);

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchSession).not.toHaveBeenCalled();
  });

  it("resumes the session from the server rather than from client state", async () => {
    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByRole("button", { name: "Record Count" })).toBeInTheDocument();
    expect(mockedFetchSession).toHaveBeenCalledWith("CS-1");
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders an ErrorState when the session cannot be loaded", async () => {
    mockedFetchSession.mockRejectedValue(new Error("network down"));

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByText("This count session could not be loaded.")).toBeInTheDocument();
  });

  it("shows the live system quantity and variance before a count is recorded", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);
    await screen.findByRole("button", { name: "Record Count" });

    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));

    expect(await screen.findByText("90")).toBeInTheDocument();

    const physical = screen.getByLabelText("Physical Quantity *");
    await user.clear(physical);
    await user.type(physical, "85");

    const variance = screen.getByText("Variance").closest("div") as HTMLElement;
    await vi.waitFor(() => expect(within(variance).getByText("-5")).toBeInTheDocument());
  });

  it("records a physical count against the session", async () => {
    const user = userEvent.setup();
    mockedAddItem.mockResolvedValue(
      makeSession({ items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }] }),
    );

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);
    await screen.findByRole("button", { name: "Record Count" });

    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));
    const physical = screen.getByLabelText("Physical Quantity *");
    await user.clear(physical);
    await user.type(physical, "85");

    await user.click(screen.getByRole("button", { name: "Record Count" }));

    await vi.waitFor(() =>
      expect(mockedAddItem).toHaveBeenCalledWith("CS-1", { needleTypeId: "NT-1", physicalQuantity: 85 }),
    );
    expect(await screen.findByRole("columnheader", { name: "Variance" })).toBeInTheDocument();
  });

  it("says plainly that nothing has been counted yet", async () => {
    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByText("Nothing counted yet.")).toBeInTheDocument();
  });

  it("completes the session behind a confirm dialog and reports the adjustments it wrote", async () => {
    const user = userEvent.setup();
    const counted = makeSession({
      items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }],
    });
    mockedFetchSession.mockResolvedValue(counted);
    const completed: CountSessionDetail = {
      ...counted,
      status: "COMPLETED",
      completedAt: "2026-09-15T09:00:00.000Z",
      adjustments: [
        { id: "MV-1", movementNumber: "MV-20260915-000010", needleTypeId: "NT-1", varianceQuantity: -5 },
      ],
    };
    // Completing invalidates the session query, so the screen re-reads the
    // server rather than trusting the mutation's own result — the mock has to
    // answer as the server now would.
    mockedComplete.mockImplementation(async (): Promise<CompleteCountSessionResult> => {
      mockedFetchSession.mockResolvedValue(completed);
      return { factoryId: "FAC-001", session: completed, adjustmentMovementIds: ["MV-1"] };
    });

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);
    await screen.findByRole("button", { name: "Complete Count" });

    await user.click(screen.getByRole("button", { name: "Complete Count" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Complete Count Session" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Complete Count" }));

    await vi.waitFor(() => expect(mockedComplete).toHaveBeenCalledWith("CS-1"));
    // The server's session is what renders afterwards — the adjustments it
    // wrote are read back, never assumed.
    expect(await screen.findByText("Adjustments Created")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "MV-20260915-000010" })).toHaveAttribute(
      "href",
      "/inventory/adjustment?id=MV-1",
    );
  });

  it("cancels the session on the server, not just on screen", async () => {
    const user = userEvent.setup();
    mockedCancel.mockResolvedValue(
      makeSession({ status: "CANCELLED", cancelledAt: "2026-09-15T09:05:00.000Z" }),
    );

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);
    await screen.findByRole("button", { name: "Cancel Session" });

    await user.click(screen.getByRole("button", { name: "Cancel Session" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Cancel Count Session" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel Session" }));

    await vi.waitFor(() => expect(mockedCancel).toHaveBeenCalledWith("CS-1"));
    expect(await screen.findByText("This session was cancelled. No stock was changed.")).toBeInTheDocument();
  });

  it("surfaces a 409 from complete inline rather than pretending it worked", async () => {
    const user = userEvent.setup();
    const conflict = new AxiosError("Conflict", "ERR_BAD_REQUEST");
    conflict.response = {
      status: 409,
      data: {
        success: false,
        error: { code: "CONFLICT", message: "A balance changed since it was counted. Recount before completing.", details: [] },
      },
    } as AxiosResponse;
    mockedComplete.mockRejectedValue(conflict);

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);
    await screen.findByRole("button", { name: "Complete Count" });

    await user.click(screen.getByRole("button", { name: "Complete Count" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Complete Count" }));

    expect(await screen.findByText(/A balance changed since it was counted/)).toBeInTheDocument();
  });
});

describe("CountSessionDetailScreen — closed session", () => {
  it("renders a completed session read-only, with its variances and the adjustments it wrote", async () => {
    mockedFetchSession.mockResolvedValue(
      makeSession({
        status: "COMPLETED",
        completedAt: "2026-09-15T09:00:00.000Z",
        items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }],
        adjustments: [
          { id: "MV-1", movementNumber: "MV-20260915-000010", needleTypeId: "NT-1", varianceQuantity: -5 },
        ],
      }),
    );

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByText("Counted Items")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Count" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete Count" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Session" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "MV-20260915-000010" })).toBeInTheDocument();
  });

  it("says a completed session found no variance rather than showing an empty table", async () => {
    mockedFetchSession.mockResolvedValue(
      makeSession({
        status: "COMPLETED",
        completedAt: "2026-09-15T09:00:00.000Z",
        items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 90, varianceQuantity: 0 }],
        adjustments: [],
      }),
    );

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByText("No variance found — no adjustment was needed.")).toBeInTheDocument();
  });

  it("renders a cancelled session as closed, with nothing reconciled", async () => {
    mockedFetchSession.mockResolvedValue(
      makeSession({
        status: "CANCELLED",
        cancelledAt: "2026-09-15T09:05:00.000Z",
        items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }],
      }),
    );

    renderWithQueryClient(<CountSessionDetailScreen sessionId="CS-1" />);

    expect(await screen.findByText("This session was cancelled. No stock was changed.")).toBeInTheDocument();
    expect(screen.queryByText("Adjustments Created")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Count" })).not.toBeInTheDocument();
  });
});
