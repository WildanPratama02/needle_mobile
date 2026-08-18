import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useAuditFilterStore } from "../store";
import type { AuditLogEntry, PagedAuditLog } from "../api/types";

vi.mock("../api/data-source", () => ({
  fetchAuditLogs: vi.fn(),
}));

vi.mock("@/core/users/data-source", () => ({
  fetchUsers: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/administration/audit",
}));

const { fetchAuditLogs } = await import("../api/data-source");
const { fetchUsers } = await import("@/core/users/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { AuditLogScreen } = await import("./audit-log-page");
const mocked = vi.mocked(fetchAuditLogs);
const mockedFetchUsers = vi.mocked(fetchUsers);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: "AUD-1",
    timestamp: "2026-08-10T08:30:00.000Z",
    action: "CREATE_EXCHANGE",
    entityType: "Exchange",
    entityId: "EX-1",
    actorUserId: "USR-001",
    actorDeviceId: null,
    factoryId: "FAC-001",
    requestId: "REQ-1",
    beforeData: null,
    afterData: null,
    metadata: null,
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedAuditLog> = {}): PagedAuditLog {
  return { items: [makeEntry()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

beforeEach(() => {
  mocked.mockReset();
  mockedFetchUsers.mockReset();
  mockedFetchUsers.mockResolvedValue([]);
  useAuditFilterStore.setState({
    actorUserId: "",
    entityType: "",
    entityId: "",
    action: "ALL",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 20,
  });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
  useSessionBootstrapStore.setState({ ready: true });
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuditLogScreen", () => {
  it("renders populated rows, newest first as returned by the backend", async () => {
    mocked.mockResolvedValue(
      makePaged({
        items: [
          makeEntry({ id: "AUD-2", action: "ISSUE_NEEDLE", timestamp: "2026-08-10T09:00:00.000Z" }),
          makeEntry({ id: "AUD-1", action: "CREATE_EXCHANGE", timestamp: "2026-08-10T08:30:00.000Z" }),
        ],
        total: 2,
      })
    );

    renderWithQueryClient(<AuditLogScreen />);
    await screen.findByText("ISSUE NEEDLE");

    const rows = screen.getAllByRole("row");
    // header + 2 body rows, body order untouched (no client re-sort)
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("ISSUE NEEDLE");
    expect(rows[2]).toHaveTextContent("CREATE EXCHANGE");
  });

  it("renders an EmptyState when there are no rows", async () => {
    mocked.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<AuditLogScreen />);

    expect(await screen.findByText("No audit records found.")).toBeInTheDocument();
  });

  it("renders an ErrorState with Retry for a non-403 error", async () => {
    const user = userEvent.setup();
    mocked.mockRejectedValueOnce(axiosError(500, "Internal error."));
    mocked.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<AuditLogScreen />);

    expect(await screen.findByText("Internal error.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("CREATE EXCHANGE")).toBeInTheDocument();
  });

  it("shows an access-denied state with no Retry button on a 403 (server disagrees with a stale client-side permission)", async () => {
    mocked.mockRejectedValue(axiosError(403, "Missing AUDIT_VIEW"));

    renderWithQueryClient(<AuditLogScreen />);

    expect(await screen.findByText("Missing AUDIT_VIEW")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("skips the request entirely and shows access-denied when the real session has no AUDIT_VIEW", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<AuditLogScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mocked).not.toHaveBeenCalled();
  });

  it("requests the new action and resets to page 1 when the Action filter changes", async () => {
    const user = userEvent.setup();
    useAuditFilterStore.setState({ page: 3 });
    mocked.mockResolvedValue(makePaged());

    renderWithQueryClient(<AuditLogScreen />);
    await screen.findByText("CREATE EXCHANGE");

    await user.click(screen.getByRole("combobox", { name: "Filter by Action" }));
    await user.click(await screen.findByRole("option", { name: "ISSUE NEEDLE" }));

    await vi.waitFor(() => {
      expect(mocked).toHaveBeenLastCalledWith(expect.objectContaining({ action: "ISSUE_NEEDLE", page: 1 }));
    });
  });

  it("requests the next page and preserves the active filters", async () => {
    const user = userEvent.setup();
    useAuditFilterStore.setState({ entityType: "Exchange" });
    mocked.mockResolvedValue(makePaged({ totalPages: 3, total: 50 }));

    renderWithQueryClient(<AuditLogScreen />);
    await screen.findByText("CREATE EXCHANGE");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    await vi.waitFor(() => {
      expect(mocked).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, entityType: "Exchange" }));
    });
  });

  it("requests the caller-scoped factory when TopBar's Factory selector isn't 'all'", async () => {
    mocked.mockResolvedValue(makePaged());
    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-002" });

    renderWithQueryClient(<AuditLogScreen />);

    await vi.waitFor(() => {
      expect(mocked).toHaveBeenCalledWith(expect.objectContaining({ factoryId: "FAC-002" }));
    });
  });

  it("does not render its own Factory selector — Factory scope lives in TopBar only", async () => {
    mocked.mockResolvedValue(makePaged());

    renderWithQueryClient(<AuditLogScreen />);

    await screen.findByText("CREATE EXCHANGE");
    expect(screen.queryByText("All Factories")).not.toBeInTheDocument();
  });

  it("keeps the Actor filter as free text for a caller without USER_MANAGE", async () => {
    mocked.mockResolvedValue(makePaged());

    renderWithQueryClient(<AuditLogScreen />);
    await screen.findByText("CREATE EXCHANGE");

    expect(screen.getByPlaceholderText("Actor User ID")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Filter by Actor" })).not.toBeInTheDocument();
    expect(mockedFetchUsers).not.toHaveBeenCalled();
  });

  it("renders the Actor filter as a Select of real users for a caller holding USER_MANAGE", async () => {
    mockedFetchCurrentUser.mockResolvedValue({
      ...MOCK_CURRENT_USER,
      permissions: [...MOCK_CURRENT_USER.permissions, "USER_MANAGE"],
    });
    mockedFetchUsers.mockResolvedValue([
      { id: "USR-001", username: "budi.santoso", name: "Budi Santoso", status: "ACTIVE", roles: [], factoryIds: [] },
    ]);
    mocked.mockResolvedValue(makePaged());

    const user = userEvent.setup();
    renderWithQueryClient(<AuditLogScreen />);
    await screen.findByText("CREATE EXCHANGE");

    expect(screen.queryByPlaceholderText("Actor User ID")).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Filter by Actor" }));
    await user.click(await screen.findByRole("option", { name: "budi.santoso — Budi Santoso" }));

    await vi.waitFor(
      () => {
        expect(mocked).toHaveBeenLastCalledWith(expect.objectContaining({ actorUserId: "USR-001" }));
      },
      { timeout: 2000 },
    );
  });
});
