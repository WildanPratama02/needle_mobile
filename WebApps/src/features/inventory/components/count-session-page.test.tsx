import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { CountSessionDetail, CompleteCountSessionResult } from "../api/count-session-types";
import type { PagedBalances } from "../api/types";

vi.mock("../api/count-session-data-source", () => ({
  createCountSession: vi.fn(),
  fetchCountSession: vi.fn(),
  addCountItem: vi.fn(),
  completeCountSession: vi.fn(),
}));

vi.mock("../api/data-source", () => ({
  fetchBalances: vi.fn(),
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

const { createCountSession, addCountItem, completeCountSession } = await import("../api/count-session-data-source");
const { fetchBalances } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { CountSessionScreen } = await import("./count-session-page");

const mockedCreateSession = vi.mocked(createCountSession);
const mockedAddItem = vi.mocked(addCountItem);
const mockedComplete = vi.mocked(completeCountSession);
const mockedFetchBalances = vi.mocked(fetchBalances);
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

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedCreateSession.mockReset();
  mockedAddItem.mockReset();
  mockedComplete.mockReset();
  mockedFetchBalances.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchBalances.mockResolvedValue({
    items: [{ locationId: "LOC-1", needleTypeId: "NT-1", quantity: 90, reservedQuantity: 0, availableQuantity: 90 }],
    page: 1,
    pageSize: 1,
    total: 1,
    totalPages: 1,
  } satisfies PagedBalances);
  withPermissions([...MOCK_CURRENT_USER.permissions, "STOCK_COUNT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CountSessionScreen", () => {
  it("refuses the screen to a caller without STOCK_COUNT", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<CountSessionScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
  });

  it("starts a count session with factory + location only", async () => {
    const user = userEvent.setup();
    mockedCreateSession.mockResolvedValue({
      id: "CS-1",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      status: "OPEN",
      createdBy: "USR-1",
      completedAt: null,
      createdAt: "2026-09-01T00:00:00.000Z",
      items: [],
    } satisfies CountSessionDetail);

    renderWithQueryClient(<CountSessionScreen />);

    await user.click(screen.getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.click(screen.getByRole("combobox", { name: "Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

    await user.click(screen.getByRole("button", { name: "Start Count" }));

    await vi.waitFor(() => expect(mockedCreateSession).toHaveBeenCalled());
    expect(mockedCreateSession.mock.calls[0][0]).toEqual({ factoryId: "FAC-001", locationId: "LOC-1" });
    expect(await screen.findByRole("button", { name: "Record Count" })).toBeInTheDocument();
  });

  it("records a physical count and shows the live variance", async () => {
    const user = userEvent.setup();
    mockedCreateSession.mockResolvedValue({
      id: "CS-1",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      status: "OPEN",
      createdBy: "USR-1",
      completedAt: null,
      createdAt: "2026-09-01T00:00:00.000Z",
      items: [],
    } satisfies CountSessionDetail);
    mockedAddItem.mockResolvedValue({
      id: "CS-1",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      status: "OPEN",
      createdBy: "USR-1",
      completedAt: null,
      createdAt: "2026-09-01T00:00:00.000Z",
      items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }],
    } satisfies CountSessionDetail);

    renderWithQueryClient(<CountSessionScreen />);
    await user.click(screen.getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.click(screen.getByRole("combobox", { name: "Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));
    await user.click(screen.getByRole("button", { name: "Start Count" }));
    await screen.findByRole("button", { name: "Record Count" });

    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));

    expect(await screen.findByText("90")).toBeInTheDocument(); // system quantity

    const physicalQuantity = screen.getByLabelText("Physical Quantity *");
    await user.clear(physicalQuantity);
    await user.type(physicalQuantity, "85");

    await user.click(screen.getByRole("button", { name: "Record Count" }));

    await vi.waitFor(() =>
      expect(mockedAddItem).toHaveBeenCalledWith("CS-1", { needleTypeId: "NT-1", physicalQuantity: 85 }),
    );
  });

  it("completes the session and reports the resulting adjustments", async () => {
    const user = userEvent.setup();
    mockedCreateSession.mockResolvedValue({
      id: "CS-1",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      status: "OPEN",
      createdBy: "USR-1",
      completedAt: null,
      createdAt: "2026-09-01T00:00:00.000Z",
      items: [],
    } satisfies CountSessionDetail);
    mockedComplete.mockResolvedValue({
      factoryId: "FAC-001",
      session: {
        id: "CS-1",
        factoryId: "FAC-001",
        locationId: "LOC-1",
        status: "COMPLETED",
        createdBy: "USR-1",
        completedAt: "2026-09-01T01:00:00.000Z",
        createdAt: "2026-09-01T00:00:00.000Z",
        items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }],
      },
      adjustmentMovementIds: ["MV-9"],
    } satisfies CompleteCountSessionResult);

    renderWithQueryClient(<CountSessionScreen />);
    await user.click(screen.getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.click(screen.getByRole("combobox", { name: "Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));
    await user.click(screen.getByRole("button", { name: "Start Count" }));
    await screen.findByRole("button", { name: "Complete Count" });

    await user.click(screen.getByRole("button", { name: "Complete Count" }));

    await vi.waitFor(() => expect(mockedComplete).toHaveBeenCalledWith("CS-1"));
    expect(await screen.findByText(/1 adjustment movement\(s\) created/)).toBeInTheDocument();
    // Back to the start form for a new session.
    expect(screen.getByRole("button", { name: "Start Count" })).toBeInTheDocument();
  });
});
