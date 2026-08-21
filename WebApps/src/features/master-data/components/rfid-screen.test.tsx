import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { PagedRfidCards, RfidCard } from "../api/rfid-types";

vi.mock("../api/rfid-data-source", () => ({
  fetchRfidCards: vi.fn(),
  enrollRfidCard: vi.fn(),
  revokeRfidCard: vi.fn(),
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

const { fetchRfidCards, enrollRfidCard, revokeRfidCard } = await import("../api/rfid-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { RfidScreen } = await import("./rfid-screen");

const mockedFetchRfidCards = vi.mocked(fetchRfidCards);
const mockedEnrollRfidCard = vi.mocked(enrollRfidCard);
const mockedRevokeRfidCard = vi.mocked(revokeRfidCard);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const EMPLOYEE = {
  id: "EMP-1",
  code: "EMP-0001",
  name: "Siti Operator",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  employeeNumber: "EMP-0001",
  department: "Sewing Line 1",
};

const ACTIVE_CARD: RfidCard = {
  id: "CARD-1",
  rfidUid: "RFID001",
  employeeId: "EMP-1",
  status: "ACTIVE",
  issuedAt: "2026-08-01T08:00:00.000Z",
  revokedAt: null,
};

const REVOKED_CARD: RfidCard = {
  id: "CARD-2",
  rfidUid: "RFID002",
  employeeId: "EMP-1",
  status: "INACTIVE",
  issuedAt: "2026-07-01T08:00:00.000Z",
  revokedAt: "2026-07-15T08:00:00.000Z",
};

function makePaged(items: RfidCard[]): PagedRfidCards {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedFetchRfidCards.mockReset();
  mockedEnrollRfidCard.mockReset();
  mockedRevokeRfidCard.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) =>
    Promise.resolve(collection === "employees" ? [EMPLOYEE] : ([] as never)),
  );
  mockedFetchRfidCards.mockResolvedValue(makePaged([ACTIVE_CARD]));
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RfidScreen", () => {
  it("refuses the screen to a caller without MASTER_VIEW", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<RfidScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchRfidCards).not.toHaveBeenCalled();
  });

  it("lists cards with the employee resolved and Active status", async () => {
    renderWithQueryClient(<RfidScreen />);

    expect(await screen.findByText("RFID001")).toBeInTheDocument();
    expect(await screen.findByText(/Siti Operator/)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("reports an empty catalogue rather than an empty table", async () => {
    mockedFetchRfidCards.mockResolvedValue(makePaged([]));

    renderWithQueryClient(<RfidScreen />);

    expect(await screen.findByText("No RFID cards found.")).toBeInTheDocument();
  });

  it("shows Revoke only for ACTIVE rows, never for a revoked one", async () => {
    mockedFetchRfidCards.mockResolvedValue(makePaged([ACTIVE_CARD, REVOKED_CARD]));

    renderWithQueryClient(<RfidScreen />);
    await screen.findByText("RFID001");
    await screen.findByText("RFID002");

    expect(screen.getAllByRole("button", { name: "Revoke" })).toHaveLength(1);
  });

  it("auto-focuses the UID input when the enroll dialog opens", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RfidScreen />);
    await screen.findByText("RFID001");

    await user.click(screen.getByRole("button", { name: "Enroll Card" }));
    const dialog = await screen.findByRole("dialog");
    const uidInput = within(dialog).getByLabelText("RFID UID *");

    expect(uidInput).toHaveFocus();
  });

  it("enrolls a card by employee + typed UID (simulating the HID reader)", async () => {
    const user = userEvent.setup();
    mockedEnrollRfidCard.mockResolvedValue(ACTIVE_CARD);

    renderWithQueryClient(<RfidScreen />);
    await screen.findByText("RFID001");

    await user.click(screen.getByRole("button", { name: "Enroll Card" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: /Siti Operator/ }));

    await user.type(within(dialog).getByLabelText("RFID UID *"), "RFID999");
    await user.click(within(dialog).getByRole("button", { name: "Enroll Card" }));

    await vi.waitFor(() => {
      expect(mockedEnrollRfidCard).toHaveBeenCalled();
    });
    expect(mockedEnrollRfidCard.mock.calls[0][0]).toEqual({ employeeId: "EMP-1", rfidUid: "RFID999" });
  });

  it("surfaces a 409 named-holder conflict inline on the UID field", async () => {
    const user = userEvent.setup();
    mockedEnrollRfidCard.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          error: { message: "RFID RFID999 is already assigned to Budi (EMP-0002)", code: "CONFLICT", details: [] },
        },
      },
    });

    renderWithQueryClient(<RfidScreen />);
    await screen.findByText("RFID001");

    await user.click(screen.getByRole("button", { name: "Enroll Card" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    await user.click(await screen.findByRole("option", { name: /Siti Operator/ }));
    await user.type(within(dialog).getByLabelText("RFID UID *"), "RFID999");
    await user.click(within(dialog).getByRole("button", { name: "Enroll Card" }));

    expect(await screen.findByText(/already assigned to Budi/)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("asks for confirmation with terminal-action copy before revoking, then updates the row in place", async () => {
    const user = userEvent.setup();
    mockedRevokeRfidCard.mockResolvedValue({
      ...ACTIVE_CARD,
      status: "INACTIVE",
      revokedAt: "2026-08-21T08:00:00.000Z",
    });

    renderWithQueryClient(<RfidScreen />);
    await screen.findByText("RFID001");

    await user.click(screen.getByRole("button", { name: "Revoke" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/cannot be undone/)).toBeInTheDocument();
    expect(mockedRevokeRfidCard).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Revoke Card" }));

    await vi.waitFor(() => {
      expect(mockedRevokeRfidCard).toHaveBeenCalled();
    });
    expect(mockedRevokeRfidCard.mock.calls[0][0]).toBe("CARD-1");
  });
});
