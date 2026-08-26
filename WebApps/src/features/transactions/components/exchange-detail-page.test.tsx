import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { ExchangeDetail, EvidenceItem } from "../api/types";
import type { Confirmation } from "@/features/confirmation/api/types";
import type { PagedAuditLog } from "@/features/audit/api/types";

vi.mock("../api/data-source", () => ({
  fetchExchangeDetail: vi.fn(),
  fetchExchangeEvidence: vi.fn(),
}));

vi.mock("@/features/confirmation/api/data-source", () => ({
  fetchConfirmation: vi.fn(),
  approveConfirmation: vi.fn(),
  rejectConfirmation: vi.fn(),
}));

vi.mock("@/features/audit/api/data-source", () => ({
  fetchAuditLogs: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("@/core/users/data-source", () => ({
  fetchAllUsers: vi.fn(),
  fetchUsers: vi.fn(),
  fetchUser: vi.fn(),
}));

const dataSource = await import("../api/data-source");
const confirmationDataSource = await import("@/features/confirmation/api/data-source");
const auditDataSource = await import("@/features/audit/api/data-source");
const authDataSource = await import("@/core/auth/data-source");
const usersDataSource = await import("@/core/users/data-source");
const { ExchangeDetailScreen } = await import("./exchange-detail-page");

const mocked = {
  detail: vi.mocked(dataSource.fetchExchangeDetail),
  evidence: vi.mocked(dataSource.fetchExchangeEvidence),
  confirmation: vi.mocked(confirmationDataSource.fetchConfirmation),
  auditLog: vi.mocked(auditDataSource.fetchAuditLogs),
  approve: vi.mocked(confirmationDataSource.approveConfirmation),
  reject: vi.mocked(confirmationDataSource.rejectConfirmation),
  currentUser: vi.mocked(authDataSource.fetchCurrentUser),
  allUsers: vi.mocked(usersDataSource.fetchAllUsers),
};

function makeExchange(overrides: Partial<ExchangeDetail> = {}): ExchangeDetail {
  return {
    id: "EX-1",
    exchangeNumber: "EXC-20260810-000001",
    status: "COMPLETED",
    factoryId: "FAC-001",
    trolleyId: "TRL-001",
    deviceId: "DEV-001",
    operatorId: "EMP-001",
    exchangeTypeId: "TYPE-001",
    exchangeTypeCode: "BROKEN",
    exchangeTypeName: "Broken Needle",
    oldNeedleTypeId: "NDL-001",
    newNeedleTypeId: "NDL-002",
    fragmentStatus: null,
    confirmationId: null,
    createdAt: "2026-08-10T08:30:00.000Z",
    completedAt: "2026-08-10T08:40:00.000Z",
    cancelledAt: null,
    ...overrides,
  };
}

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

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

beforeEach(() => {
  vi.clearAllMocks();
  useSessionBootstrapStore.setState({ ready: true });
  mocked.evidence.mockResolvedValue([]);
  mocked.auditLog.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 } satisfies PagedAuditLog);
  mocked.currentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mocked.allUsers.mockResolvedValue([]);
});

describe("ExchangeDetailScreen", () => {
  it("renders the exchange summary once resolved", async () => {
    mocked.detail.mockResolvedValue(makeExchange());

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByRole("heading", { name: "EXC-20260810-000001" })).toBeInTheDocument();
    expect(screen.getByText("FAC-001")).toBeInTheDocument();
    expect(screen.queryByText("Confirmation")).not.toBeInTheDocument();
  });

  it("shows the backend's real error message (e.g. not found) instead of a generic one", async () => {
    mocked.detail.mockRejectedValue(axiosError(404, "Exchange EX-1 not found."));

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("Exchange EX-1 not found.")).toBeInTheDocument();
  });

  it("renders the EvidenceGallery empty state when no evidence exists", async () => {
    mocked.detail.mockResolvedValue(makeExchange());

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("No evidence uploaded yet.")).toBeInTheDocument();
  });

  it("renders uploaded evidence with its status", async () => {
    mocked.detail.mockResolvedValue(makeExchange());
    mocked.evidence.mockResolvedValue([
      {
        id: "EVD-1",
        exchangeId: "EX-1",
        evidenceType: "OLD_NEEDLE",
        storageKey: "exchanges/2026/08/EX-1/EVD-1.jpg",
        status: "UPLOADED",
        fileName: "old-needle.jpg",
        mimeType: "image/jpeg",
        checksum: "abc123",
        capturedAt: "2026-08-10T08:32:00.000Z",
        uploadedAt: "2026-08-10T08:33:00.000Z",
        url: "https://minio.local/evidence/EVD-1.jpg?sig=xyz",
      } satisfies EvidenceItem,
    ]);

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("Uploaded")).toBeInTheDocument();
    expect(screen.getByAltText("OLD_NEEDLE")).toHaveAttribute("src", "https://minio.local/evidence/EVD-1.jpg?sig=xyz");
  });

  it("shows the Confirmation panel with Approve/Reject actions only while PENDING", async () => {
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(makeConfirmation({ status: "PENDING" }));

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("CNF-20260810-000001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("hides Approve/Reject once the confirmation is already decided", async () => {
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(
      makeConfirmation({
        status: "APPROVED",
        decidedAt: "2026-08-10T08:40:00.000Z",
        decisions: [
          { id: "DEC-1", decision: "APPROVED", decidedBy: "USR-002", reason: null, decidedAt: "2026-08-10T08:40:00.000Z" },
        ],
      })
    );

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    await screen.findByText("CNF-20260810-000001");
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(screen.getByText("USR-002", { exact: false })).toBeInTheDocument();
  });

  it("requires a reason before Reject can be confirmed, then calls the API with it", async () => {
    const user = userEvent.setup();
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(makeConfirmation({ status: "PENDING" }));
    mocked.reject.mockResolvedValue(makeConfirmation({ status: "REJECTED" }));

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);
    await screen.findByRole("button", { name: "Reject" });

    await user.click(screen.getByRole("button", { name: "Reject" }));
    const confirmButton = screen.getByRole("button", { name: "Confirm Rejection" });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Reason for rejection *"), "Fragment not located");
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await vi.waitFor(() => {
      expect(mocked.reject).toHaveBeenCalledWith("CNF-1", "Fragment not located");
    });
  });

  it("calls approve with an optional reason and closes the dialog", async () => {
    const user = userEvent.setup();
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(makeConfirmation({ status: "PENDING" }));
    mocked.approve.mockResolvedValue(makeConfirmation({ status: "APPROVED" }));

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);
    await screen.findByRole("button", { name: "Approve" });

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Confirm Approval" }));

    await vi.waitFor(() => {
      expect(mocked.approve).toHaveBeenCalledWith("CNF-1", undefined);
    });
    await vi.waitFor(() => {
      expect(screen.queryByRole("button", { name: "Confirm Approval" })).not.toBeInTheDocument();
    });
  });

  it("resolves requestedToUserId/decidedBy to real names when USER_MANAGE is held", async () => {
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(
      makeConfirmation({
        requestedToUserId: "USR-001",
        status: "APPROVED",
        decidedAt: "2026-08-10T08:40:00.000Z",
        decisions: [
          { id: "DEC-1", decision: "APPROVED", decidedBy: "USR-002", reason: null, decidedAt: "2026-08-10T08:40:00.000Z" },
        ],
      })
    );
    mocked.allUsers.mockResolvedValue([
      { id: "USR-001", username: "budi", name: "Budi Santoso", status: "ACTIVE", roles: [], factoryIds: [] },
      { id: "USR-002", username: "siti", name: "Siti Aminah", status: "ACTIVE", roles: [], factoryIds: [] },
    ]);

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(await screen.findByText("Siti Aminah")).toBeInTheDocument();
    expect(screen.queryByText("USR-001")).not.toBeInTheDocument();
  });

  it("falls back to the raw id when a user id cannot be resolved from the directory", async () => {
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(makeConfirmation({ requestedToUserId: "USR-UNKNOWN" }));
    mocked.allUsers.mockResolvedValue([]);

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("USR-UNKNOWN")).toBeInTheDocument();
  });

  it("never issues a users lookup when the session lacks USER_MANAGE, and still shows the raw id", async () => {
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(makeConfirmation({ requestedToUserId: "USR-001" }));
    mocked.currentUser.mockResolvedValue({
      ...MOCK_CURRENT_USER,
      permissions: MOCK_CURRENT_USER.permissions.filter((p) => p !== "USER_MANAGE"),
    });

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("USR-001")).toBeInTheDocument();
    expect(mocked.allUsers).not.toHaveBeenCalled();
  });

  it("hides the Audit Trail section without ever requesting it when the session lacks AUDIT_VIEW", async () => {
    mocked.detail.mockResolvedValue(makeExchange());
    mocked.currentUser.mockResolvedValue({
      ...MOCK_CURRENT_USER,
      permissions: MOCK_CURRENT_USER.permissions.filter((p) => p !== "AUDIT_VIEW"),
    });

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    await screen.findByText("FAC-001");
    await vi.waitFor(() => expect(screen.queryByText("Audit Trail")).not.toBeInTheDocument());
    expect(mocked.auditLog).not.toHaveBeenCalled();
  });

  it("shows an error if the Audit Trail request fails despite having AUDIT_VIEW", async () => {
    mocked.detail.mockResolvedValue(makeExchange());
    mocked.auditLog.mockRejectedValue(axiosError(403, "Missing AUDIT_VIEW"));

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    await screen.findByText("FAC-001");
    await screen.findByText("Audit Trail");
    expect(await screen.findByText("Missing AUDIT_VIEW")).toBeInTheDocument();
  });

  it("renders real audit entries when authorized", async () => {
    mocked.detail.mockResolvedValue(makeExchange());
    mocked.auditLog.mockResolvedValue({
      items: [
        {
          id: "AUD-1",
          timestamp: "2026-08-10T08:30:00.000Z",
          action: "CREATE_EXCHANGE",
          entityType: "Exchange",
          entityId: "EX-1",
          actorUserId: "USR-003",
          actorDeviceId: null,
          factoryId: "FAC-001",
          requestId: "REQ-1",
          beforeData: null,
          afterData: null,
          metadata: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    } satisfies PagedAuditLog);

    mocked.allUsers.mockResolvedValue([
      { id: "USR-003", username: "wati", name: "Wati Rahayu", status: "ACTIVE", roles: [], factoryIds: [] },
    ]);

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    expect(await screen.findByText("CREATE EXCHANGE")).toBeInTheDocument();
    expect(await screen.findByText("Wati Rahayu")).toBeInTheDocument();
  });

  it("issues at most one users lookup for the whole screen (Confirmation panel + Audit Trail share it)", async () => {
    mocked.detail.mockResolvedValue(makeExchange({ confirmationId: "CNF-1" }));
    mocked.confirmation.mockResolvedValue(makeConfirmation({ requestedToUserId: "USR-001" }));
    mocked.auditLog.mockResolvedValue({
      items: [
        {
          id: "AUD-1",
          timestamp: "2026-08-10T08:30:00.000Z",
          action: "CREATE_EXCHANGE",
          entityType: "Exchange",
          entityId: "EX-1",
          actorUserId: "USR-003",
          actorDeviceId: null,
          factoryId: "FAC-001",
          requestId: "REQ-1",
          beforeData: null,
          afterData: null,
          metadata: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    } satisfies PagedAuditLog);
    mocked.allUsers.mockResolvedValue([]);

    renderWithQueryClient(<ExchangeDetailScreen exchangeId="EX-1" />);

    await screen.findByText("CNF-20260810-000001");
    await screen.findByText("CREATE EXCHANGE");

    await vi.waitFor(() => {
      expect(mocked.allUsers).toHaveBeenCalledTimes(1);
    });
  });
});
