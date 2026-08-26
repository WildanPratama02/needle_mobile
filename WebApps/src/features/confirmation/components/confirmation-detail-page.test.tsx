import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { Confirmation } from "../api/types";

vi.mock("@/features/confirmation/api/data-source", () => ({
  fetchConfirmation: vi.fn(),
  approveConfirmation: vi.fn(),
  rejectConfirmation: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("@/core/users/data-source", () => ({
  fetchAllUsers: vi.fn(),
  fetchUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

const dataSource = await import("@/features/confirmation/api/data-source");
const authDataSource = await import("@/core/auth/data-source");
const usersDataSource = await import("@/core/users/data-source");
const { ConfirmationDetailScreen } = await import("./confirmation-detail-page");
const mockedFetchConfirmation = vi.mocked(dataSource.fetchConfirmation);
const mockedFetchCurrentUser = vi.mocked(authDataSource.fetchCurrentUser);
const mockedFetchAllUsers = vi.mocked(usersDataSource.fetchAllUsers);

beforeEach(() => {
  useSessionBootstrapStore.setState({ ready: true });
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchAllUsers.mockResolvedValue([]);
});

function makeConfirmation(overrides: Partial<Confirmation> = {}): Confirmation {
  return {
    id: "CNF-1",
    confirmationNumber: "CNF-20260810-000001",
    exchangeId: "EX-1",
    exchangeNumber: "EXC-20260810-000001",
    exchangeStatus: "CONFIRMATION_PENDING",
    factoryId: "FAC-001",
    status: "PENDING",
    requestedToUserId: "USR-001",
    requestedAt: "2026-08-10T08:31:00.000Z",
    dueAt: "2026-08-10T09:31:00.000Z",
    decidedAt: null,
    decisions: [],
    ...overrides,
  };
}

describe("ConfirmationDetailScreen", () => {
  it("renders the title and reuses ConfirmationPanel once the confirmation resolves", async () => {
    mockedFetchConfirmation.mockResolvedValue(makeConfirmation());

    renderWithQueryClient(<ConfirmationDetailScreen confirmationId="CNF-1" />);

    expect(await screen.findByRole("heading", { name: "CNF-20260810-000001" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("shows the backend's real error message on failure", async () => {
    const error = new Error("Confirmation not found.") as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = { status: 404, data: { error: { message: "Confirmation not found." } } };
    mockedFetchConfirmation.mockRejectedValue(error);

    renderWithQueryClient(<ConfirmationDetailScreen confirmationId="CNF-404" />);

    expect(await screen.findByText("Confirmation not found.")).toBeInTheDocument();
  });
});
