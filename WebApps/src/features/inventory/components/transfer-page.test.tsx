import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { BalanceItem, PagedBalances, TransferResult } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchBalances: vi.fn(),
  createTransfer: vi.fn(),
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

const { fetchBalances, createTransfer } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { TransferScreen } = await import("./transfer-page");

const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedCreateTransfer = vi.mocked(createTransfer);
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
const SOURCE_LOCATION = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationType: "WAREHOUSE" as const,
  parentLocationId: null,
};
const DESTINATION_LOCATION = {
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

function masterDataFor(collection: string) {
  if (collection === "factories") return [FACTORY];
  if (collection === "locations") return [SOURCE_LOCATION, DESTINATION_LOCATION];
  if (collection === "needle-types") return [NEEDLE_TYPE];
  return [];
}

function balanceFor(locationId: string, quantity: number): BalanceItem {
  return { locationId, needleTypeId: "NT-1", quantity, reservedQuantity: 0, availableQuantity: quantity };
}

async function fillTransferForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Factory" }));
  await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

  await user.click(screen.getByRole("combobox", { name: "Source Location" }));
  await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

  await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
  await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

  await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));

  const quantity = screen.getByLabelText("Quantity *");
  await user.clear(quantity);
  await user.type(quantity, "20");
}

beforeEach(() => {
  mockedFetchBalances.mockReset();
  mockedCreateTransfer.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchBalances.mockImplementation((filters) => {
    const quantity = filters.locationId === "LOC-1" ? 100 : 5;
    return Promise.resolve({
      items: [balanceFor(filters.locationId, quantity)],
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    } satisfies PagedBalances);
  });
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TransferScreen", () => {
  it("refuses the screen to a caller without STOCK_TRANSFER", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<TransferScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
  });

  it("shows only locations within the selected factory in both pickers", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);

    await user.click(screen.getByRole("combobox", { name: "Source Location" }));
    expect(await screen.findByRole("option", { name: /Main Warehouse/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Trolley A-01/ })).toBeInTheDocument();
  });

  it("blocks submit when source and destination are the same location", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);

    await user.click(screen.getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

    await user.click(screen.getByRole("combobox", { name: "Source Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

    await user.click(screen.getByRole("combobox", { name: "Destination Location" }));
    await user.click(await screen.findByRole("option", { name: /Main Warehouse/ }));

    await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
    await user.click(await screen.findByRole("option", { name: /DBx1/ }));

    const quantity = screen.getByLabelText("Quantity *");
    await user.clear(quantity);
    await user.type(quantity, "5");

    await user.click(screen.getByRole("button", { name: "Review Transfer" }));

    expect(await screen.findByText("Source and destination must be different locations")).toBeInTheDocument();
    expect(mockedCreateTransfer).not.toHaveBeenCalled();
  });

  it("shows the ConfirmDialog with source/destination balance impact", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TransferScreen />);

    await fillTransferForm(user);
    await user.click(screen.getByRole("button", { name: "Review Transfer" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Confirm Transfer" })).toBeInTheDocument();
    expect(within(dialog).getByText("100")).toBeInTheDocument(); // Source Current
    expect(within(dialog).getByText("80")).toBeInTheDocument(); // Source After
    expect(within(dialog).getByText("5")).toBeInTheDocument(); // Destination Current
    expect(within(dialog).getByText("25")).toBeInTheDocument(); // Destination After
  });

  it("submits the transfer with the exact payload on confirm", async () => {
    const user = userEvent.setup();
    mockedCreateTransfer.mockResolvedValue({
      transferId: "TRF-1",
      outMovementNumber: "MV-1",
      inMovementNumber: "MV-2",
      factoryId: "FAC-001",
      sourceLocationId: "LOC-1",
      destinationLocationId: "LOC-2",
      needleTypeId: "NT-1",
      quantity: 20,
      sourceBalanceQuantity: 80,
      destinationBalanceQuantity: 25,
      createdAt: "2026-08-20T08:30:00.000Z",
    } satisfies TransferResult);

    renderWithQueryClient(<TransferScreen />);
    await fillTransferForm(user);
    await user.click(screen.getByRole("button", { name: "Review Transfer" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    await vi.waitFor(() => {
      expect(mockedCreateTransfer).toHaveBeenCalled();
    });
    expect(mockedCreateTransfer.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        factoryId: "FAC-001",
        sourceLocationId: "LOC-1",
        destinationLocationId: "LOC-2",
        needleTypeId: "NT-1",
        quantity: 20,
      })
    );
    expect(mockedCreateTransfer).toHaveBeenCalledTimes(1);
  });

  it("surfaces a 409 insufficient-stock error distinctly from a 400 same-location error", async () => {
    const user = userEvent.setup();
    const insufficientStock = new AxiosError("Conflict", "ERR_BAD_REQUEST");
    insufficientStock.response = {
      status: 409,
      data: {
        success: false,
        error: { code: "CONFLICT", message: "Insufficient stock at location LOC-1 for needle type NT-1: 20 requested", details: [] },
      },
    } as AxiosResponse;
    mockedCreateTransfer.mockRejectedValue(insufficientStock);

    renderWithQueryClient(<TransferScreen />);
    await fillTransferForm(user);
    await user.click(screen.getByRole("button", { name: "Review Transfer" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    expect(await screen.findByText(/Insufficient stock at location LOC-1/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
