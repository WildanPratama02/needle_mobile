import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useConfirmationFilterStore } from "../store";
import type { ConfirmationListItem, PagedConfirmations } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchConfirmations: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/transactions/confirmation",
}));

// The screen is gated on CONFIRMATION_VIEW now, so it needs a real session to
// render at all — same seam, mock the data-source and let `useCurrentUser` run.
vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const { fetchConfirmations } = await import("../api/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { ConfirmationMonitoringScreen } = await import("./confirmation-monitoring-page");
const mockedFetchConfirmations = vi.mocked(fetchConfirmations);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeItem(overrides: Partial<ConfirmationListItem> = {}): ConfirmationListItem {
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

function makePaged(overrides: Partial<PagedConfirmations> = {}): PagedConfirmations {
  return {
    items: [makeItem()],
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

beforeEach(() => {
  mockedFetchConfirmations.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  useSessionBootstrapStore.setState({ ready: true });
  useConfirmationFilterStore.setState({ status: "PENDING", page: 1, pageSize: 20 });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConfirmationMonitoringScreen", () => {
  /**
   * Viewing the queue needs `CONFIRMATION_VIEW`; deciding needs the separate
   * approve/reject grants, gated per-action on the detail screen. A user who
   * can decide but not view would be a contradiction the backend would refuse
   * anyway — this asserts only the view gate.
   */
  it("refuses the screen to a caller without CONFIRMATION_VIEW", async () => {
    mockedFetchCurrentUser.mockResolvedValue({
      ...MOCK_CURRENT_USER,
      permissions: ["DASHBOARD_VIEW"],
    });

    renderWithQueryClient(<ConfirmationMonitoringScreen />);

    expect(
      await screen.findByText("You do not have access to this resource.")
    ).toBeInTheDocument();
    expect(mockedFetchConfirmations).not.toHaveBeenCalled();
  });

  it("renders populated rows", async () => {
    mockedFetchConfirmations.mockResolvedValue(makePaged());

    renderWithQueryClient(<ConfirmationMonitoringScreen />);

    expect(await screen.findByText("CNF-20260810-000001")).toBeInTheDocument();
    expect(screen.getByText("EXC-20260810-000001")).toBeInTheDocument();
  });

  it("renders an EmptyState when there are no rows", async () => {
    mockedFetchConfirmations.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<ConfirmationMonitoringScreen />);

    expect(await screen.findByText("No confirmations found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchConfirmations.mockRejectedValueOnce(new Error("network down"));
    mockedFetchConfirmations.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<ConfirmationMonitoringScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("CNF-20260810-000001")).toBeInTheDocument();
  });

  it("requests the new status and resets to page 1 when a status tab is clicked", async () => {
    const user = userEvent.setup();
    useConfirmationFilterStore.setState({ page: 3 });
    mockedFetchConfirmations.mockResolvedValue(makePaged());

    renderWithQueryClient(<ConfirmationMonitoringScreen />);
    await screen.findByText("CNF-20260810-000001");

    await user.click(screen.getByRole("tab", { name: "Approved" }));

    await vi.waitFor(() => {
      expect(mockedFetchConfirmations).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "APPROVED", page: 1 })
      );
    });
  });

  it("requests the next page and preserves the active status", async () => {
    const user = userEvent.setup();
    mockedFetchConfirmations.mockResolvedValue(makePaged({ totalPages: 3, total: 50 }));

    renderWithQueryClient(<ConfirmationMonitoringScreen />);
    await screen.findByText("CNF-20260810-000001");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    await vi.waitFor(() => {
      expect(mockedFetchConfirmations).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, status: "PENDING" })
      );
    });
  });

  it("does not render its own Factory selector — Factory scope lives in TopBar only", async () => {
    mockedFetchConfirmations.mockResolvedValue(makePaged());

    renderWithQueryClient(<ConfirmationMonitoringScreen />);

    await screen.findByText("CNF-20260810-000001");
    expect(screen.queryByText("All Factories")).not.toBeInTheDocument();
  });
});
