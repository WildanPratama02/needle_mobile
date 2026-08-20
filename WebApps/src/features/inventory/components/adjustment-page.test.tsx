import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { AdjustmentResult, BalanceItem, PagedBalances } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchBalances: vi.fn(),
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

const { fetchBalances, createAdjustment } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { AdjustmentScreen } = await import("./adjustment-page");

const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedCreateAdjustment = vi.mocked(createAdjustment);
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

function makeBalancePaged(quantity: number): PagedBalances {
  const item: BalanceItem = { locationId: "LOC-1", needleTypeId: "NT-1", quantity, reservedQuantity: 0, availableQuantity: quantity };
  return { items: [item], page: 1, pageSize: 1, total: 1, totalPages: 1 };
}

async function selectLocationAndNeedleType(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Factory" }));
  await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

  await user.click(screen.getByRole("combobox", { name: "Location" }));
  await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

  await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));
}

beforeEach(() => {
  mockedFetchBalances.mockReset();
  mockedCreateAdjustment.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchBalances.mockResolvedValue(makeBalancePaged(100));
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdjustmentScreen", () => {
  it("refuses the screen to a caller without STOCK_ADJUST", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<AdjustmentScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
  });

  it("shows system quantity vs. actual quantity vs. variance live in the form", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);

    await selectLocationAndNeedleType(user);

    expect(await screen.findByText("System Quantity")).toBeInTheDocument();
    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "97");

    expect(await screen.findByText("-3")).toBeInTheDocument();
  });

  it("blocks submit when reason is missing", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);

    await selectLocationAndNeedleType(user);
    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "97");

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));

    expect(await screen.findByText("Reason is required")).toBeInTheDocument();
    expect(mockedCreateAdjustment).not.toHaveBeenCalled();
  });

  it("shows the ConfirmDialog with system/actual/variance and reason before applying", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);

    await selectLocationAndNeedleType(user);
    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "97");
    await user.type(screen.getByLabelText("Reason *"), "Physical count discrepancy");

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Confirm Stock Adjustment" })).toBeInTheDocument();
    expect(within(dialog).getByText("100")).toBeInTheDocument(); // System Quantity
    expect(within(dialog).getByText("97")).toBeInTheDocument(); // Actual Quantity
    expect(within(dialog).getByText("-3")).toBeInTheDocument(); // Variance
    expect(within(dialog).getByText("Physical count discrepancy")).toBeInTheDocument();
    expect(mockedCreateAdjustment).not.toHaveBeenCalled();
  });

  it("applies immediately on confirm — no pending/approval state", async () => {
    const user = userEvent.setup();
    mockedCreateAdjustment.mockResolvedValue({
      movementId: "MOV-1",
      movementNumber: "MV-20260820-000001",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      systemQuantity: 100,
      actualQuantity: 97,
      varianceQuantity: -3,
      reason: "Physical count discrepancy",
      createdAt: "2026-08-20T08:30:00.000Z",
    } satisfies AdjustmentResult);

    renderWithQueryClient(<AdjustmentScreen />);
    await selectLocationAndNeedleType(user);
    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "97");
    await user.type(screen.getByLabelText("Reason *"), "Physical count discrepancy");

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Confirm Adjustment" }));

    await vi.waitFor(() => {
      expect(mockedCreateAdjustment).toHaveBeenCalled();
    });
    expect(mockedCreateAdjustment.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        factoryId: "FAC-001",
        locationId: "LOC-1",
        needleTypeId: "NT-1",
        actualQuantity: 97,
        reason: "Physical count discrepancy",
      })
    );

    // No pending/approval StatusBadge anywhere — the dialog just closes,
    // no Confirmation-style pending state is ever rendered for an Adjustment.
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Confirmation")).not.toBeInTheDocument();
  });

  it("disables the Confirm button while in flight, guarding against a duplicate apply", async () => {
    const user = userEvent.setup();
    let resolve!: (value: AdjustmentResult) => void;
    mockedCreateAdjustment.mockReturnValue(new Promise((r) => (resolve = r)));

    renderWithQueryClient(<AdjustmentScreen />);
    await selectLocationAndNeedleType(user);
    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "97");
    await user.type(screen.getByLabelText("Reason *"), "Physical count discrepancy");

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Confirm Adjustment" }));

    expect(mockedCreateAdjustment).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Processing…" })).toBeDisabled();

    resolve({
      movementId: "MOV-1",
      movementNumber: "MV-20260820-000001",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      systemQuantity: 100,
      actualQuantity: 97,
      varianceQuantity: -3,
      reason: "Physical count discrepancy",
      createdAt: "2026-08-20T08:30:00.000Z",
    });
  });
});
