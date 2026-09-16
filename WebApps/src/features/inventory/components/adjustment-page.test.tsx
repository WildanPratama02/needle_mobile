import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useAdjustmentHistoryFilterStore } from "../store";
import type { AdjustmentResult, BalanceItem, PagedBalances } from "../api/types";
import type { AdjustmentDetail, AdjustmentHistoryItem, Paged } from "../api/operation-history-types";

/**
 * `/inventory/adjustment`, history-first. The rules under test are the ones
 * the spec added (`.scratch/inventory-operation-history/spec.md` decisions
 * 3–4): a reason code is mandatory, `OTHER` needs a note, and a manual
 * adjustment cannot be made without evidence — uploaded first, then cited by
 * id. Adjustments a count session wrote are listed too, and need no evidence.
 */

vi.mock("../api/operation-history-data-source", () => ({
  fetchTransfers: vi.fn(),
  fetchTransfer: vi.fn(),
  fetchReturns: vi.fn(),
  fetchReturn: vi.fn(),
  fetchAdjustments: vi.fn(),
  fetchAdjustment: vi.fn(),
  uploadAdjustmentEvidence: vi.fn(),
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

const { fetchAdjustments, fetchAdjustment, uploadAdjustmentEvidence } = await import(
  "../api/operation-history-data-source"
);
const { fetchBalances, createAdjustment } = await import("../api/data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { fetchAllUsers } = await import("@/core/users/data-source");
const { AdjustmentScreen } = await import("./adjustment-page");

const mockedFetchAdjustments = vi.mocked(fetchAdjustments);
const mockedFetchAdjustment = vi.mocked(fetchAdjustment);
const mockedUploadEvidence = vi.mocked(uploadAdjustmentEvidence);
const mockedFetchBalances = vi.mocked(fetchBalances);
const mockedCreateAdjustment = vi.mocked(createAdjustment);
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

function makeAdjustment(overrides: Partial<AdjustmentHistoryItem> = {}): AdjustmentHistoryItem {
  return {
    id: "MV-ID-1",
    movementNumber: "MV-20260915-000003",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    needleTypeId: "NT-1",
    reasonCode: "DAMAGED",
    reason: "Bent in drawer",
    systemQuantity: 100,
    actualQuantity: 95,
    varianceQuantity: -5,
    countSessionId: null,
    evidenceCount: 1,
    createdBy: "USR-000",
    createdAt: "2026-09-15T08:00:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<Paged<AdjustmentHistoryItem>> = {}): Paged<AdjustmentHistoryItem> {
  return { items: [makeAdjustment()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function makeBalancePaged(quantity: number): PagedBalances {
  const item: BalanceItem = {
    locationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity,
    reservedQuantity: 0,
    availableQuantity: quantity,
  };
  return { items: [item], page: 1, pageSize: 1, total: 1, totalPages: 1 };
}

async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /New Adjustment/ }));
  return screen.findByRole("heading", { name: "New Adjustment" });
}

async function pickLocationAndNeedleType(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Location" }));
  await user.click(await screen.findByRole("option", { name: /Trolley A-01/ }));

  await user.click(screen.getByRole("combobox", { name: "Needle Type" }));
  await user.click(await screen.findByRole("option", { name: /DBx1/ }));
}

async function attachEvidence(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["photo-bytes"], "count-sheet.jpg", { type: "image/jpeg" });
  await user.upload(screen.getByLabelText("Evidence *"), file);
  return screen.findByText("count-sheet.jpg");
}

beforeEach(() => {
  mockedFetchAdjustments.mockReset();
  mockedFetchAdjustment.mockReset();
  mockedUploadEvidence.mockReset();
  mockedFetchBalances.mockReset();
  mockedCreateAdjustment.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchAllUsers.mockReset();

  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
  mockedFetchAllUsers.mockResolvedValue([
    { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: [], factoryIds: ["FAC-001"] },
  ]);
  mockedFetchAdjustments.mockResolvedValue(makePaged());
  mockedFetchBalances.mockResolvedValue(makeBalancePaged(100));
  mockedUploadEvidence.mockResolvedValue({
    id: "EV-1",
    fileName: "count-sheet.jpg",
    mimeType: "image/jpeg",
    fileSize: 123456,
    createdAt: "2026-09-15T07:50:00.000Z",
  });

  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });
  useAdjustmentHistoryFilterStore.setState({
    locationId: "",
    needleTypeId: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 20,
    extra: { reasonCode: "ALL" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdjustmentScreen — history", () => {
  it("refuses the history to a caller without STOCK_VIEW", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["STOCK_ADJUST"] });

    renderWithQueryClient(<AdjustmentScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchAdjustments).not.toHaveBeenCalled();
  });

  it("renders a manual adjustment row with its reason code, quantities and signed variance", async () => {
    renderWithQueryClient(<AdjustmentScreen />);

    expect(await screen.findByText("MV-20260915-000003")).toBeInTheDocument();
    expect(screen.getByText("Damaged")).toBeInTheDocument();
    expect(screen.getByText("100 → 95")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(await screen.findByText("Test Admin")).toBeInTheDocument();
  });

  it("links an adjustment a count session wrote back to that session", async () => {
    mockedFetchAdjustments.mockResolvedValue(
      makePaged({
        items: [makeAdjustment({ reasonCode: "PHYSICAL_COUNT", countSessionId: "CS-1", evidenceCount: 0 })],
      }),
    );

    renderWithQueryClient(<AdjustmentScreen />);

    const link = await screen.findByRole("link", { name: "Physical Count" });
    expect(link).toHaveAttribute("href", "/inventory/count/CS-1");
  });

  it("says so plainly when a legacy adjustment never recorded its quantities", async () => {
    mockedFetchAdjustments.mockResolvedValue(
      makePaged({ items: [makeAdjustment({ systemQuantity: null, actualQuantity: null, reasonCode: "OTHER" })] }),
    );

    renderWithQueryClient(<AdjustmentScreen />);

    expect(await screen.findByText("Not recorded")).toBeInTheDocument();
  });

  it("renders an EmptyState when no adjustments match", async () => {
    mockedFetchAdjustments.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<AdjustmentScreen />);

    expect(await screen.findByText("No adjustments found.")).toBeInTheDocument();
  });

  it("renders an ErrorState and refetches on Retry", async () => {
    const user = userEvent.setup();
    mockedFetchAdjustments.mockRejectedValueOnce(new Error("network down"));
    mockedFetchAdjustments.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<AdjustmentScreen />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("MV-20260915-000003")).toBeInTheDocument();
  });

  it("requests the chosen reason code", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");

    await user.click(screen.getByRole("combobox", { name: "Filter by Reason Code" }));
    await user.click(await screen.findByRole("option", { name: "Lost" }));

    await vi.waitFor(() => {
      expect(mockedFetchAdjustments).toHaveBeenLastCalledWith(
        expect.objectContaining({ reasonCode: "LOST", page: 1 }),
      );
    });
  });

  it("opens the detail with its evidence for the row that was clicked", async () => {
    const user = userEvent.setup();
    mockedFetchAdjustment.mockResolvedValue({
      ...makeAdjustment(),
      evidence: [
        {
          id: "EV-1",
          fileName: "count-sheet.jpg",
          mimeType: "image/jpeg",
          fileSize: 123456,
          url: "https://example.test/presigned/count-sheet.jpg",
          createdAt: "2026-09-15T07:50:00.000Z",
        },
      ],
    } satisfies AdjustmentDetail);

    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");

    await user.click(screen.getByRole("button", { name: "View adjustment MV-20260915-000003" }));

    expect(await screen.findByRole("heading", { name: "Adjustment Detail" })).toBeInTheDocument();
    // Keyed by the ADJUSTMENT movement id, per the contract.
    expect(mockedFetchAdjustment).toHaveBeenCalledWith("MV-ID-1");
    expect(await screen.findByText("Evidence (1)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open count-sheet.jpg" })).toHaveAttribute(
      "href",
      "https://example.test/presigned/count-sheet.jpg",
    );
  });

  it("explains a count-session adjustment's missing evidence instead of showing an empty list", async () => {
    mockedFetchAdjustment.mockResolvedValue({
      ...makeAdjustment({ reasonCode: "PHYSICAL_COUNT", countSessionId: "CS-1", evidenceCount: 0 }),
      evidence: [],
    } satisfies AdjustmentDetail);

    renderWithQueryClient(<AdjustmentScreen initialDetailId="MV-ID-1" />);

    expect(await screen.findByText(/the session and its counted items are the evidence/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open count session" })).toHaveAttribute("href", "/inventory/count/CS-1");
  });
});

describe("AdjustmentScreen — create", () => {
  it("hides New Adjustment from a caller who may read history but not adjust", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["STOCK_VIEW"] });

    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");

    expect(screen.queryByRole("button", { name: /New Adjustment/ })).not.toBeInTheDocument();
  });

  it("shows system vs. actual vs. variance live, read from the server's balance", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);

    expect(await screen.findByText("System Quantity")).toBeInTheDocument();
    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "97");

    // "Variance" is also a history column header — scope to the form's own preview.
    const preview = screen.getByText("System Quantity").closest("dl") as HTMLElement;
    await vi.waitFor(() => expect(within(preview).getByText("-3")).toBeInTheDocument());
  });

  it("refuses to submit without a reason code", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);
    await attachEvidence(user);

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));

    expect(await screen.findByText("Reason code is required")).toBeInTheDocument();
    expect(mockedCreateAdjustment).not.toHaveBeenCalled();
  });

  it("refuses to submit without at least one evidence file", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);

    await user.click(screen.getByRole("combobox", { name: "Reason Code" }));
    await user.click(await screen.findByRole("option", { name: "Damaged" }));

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));

    expect(await screen.findByText("Upload at least one evidence file (photo or PDF)")).toBeInTheDocument();
    expect(mockedCreateAdjustment).not.toHaveBeenCalled();
  });

  it("requires a note when the reason code is Other", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);
    await attachEvidence(user);

    await user.click(screen.getByRole("combobox", { name: "Reason Code" }));
    await user.click(await screen.findByRole("option", { name: "Other" }));

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));

    expect(await screen.findByText("A note is required when the reason code is Other")).toBeInTheDocument();
    expect(mockedCreateAdjustment).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file before it costs a round trip", async () => {
    // `applyAccept: false` so the file actually reaches the component:
    // userEvent otherwise drops it on the input's own `accept` attribute, and
    // the client-side guard under test would never run.
    const user = userEvent.setup({ applyAccept: false });
    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);

    const bad = new File(["#!/bin/sh"], "script.sh", { type: "application/x-sh" });
    await user.upload(screen.getByLabelText("Evidence *"), bad);

    expect(await screen.findByText(/only JPEG, PNG or WebP photos and PDF files are accepted/)).toBeInTheDocument();
    expect(mockedUploadEvidence).not.toHaveBeenCalled();
  });

  it("uploads each evidence file first, then submits only the returned ids", async () => {
    const user = userEvent.setup();
    mockedCreateAdjustment.mockResolvedValue({
      movementId: "MV-ID-2",
      movementNumber: "MV-20260915-000009",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      systemQuantity: 100,
      actualQuantity: 95,
      varianceQuantity: -5,
      reasonCode: "DAMAGED",
      reason: null,
      evidenceIds: ["EV-1"],
      countSessionId: null,
      createdAt: "2026-09-15T08:30:00.000Z",
    } satisfies AdjustmentResult);

    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);

    const actualQuantity = screen.getByLabelText("Actual Quantity (physical count) *");
    await user.clear(actualQuantity);
    await user.type(actualQuantity, "95");

    await user.click(screen.getByRole("combobox", { name: "Reason Code" }));
    await user.click(await screen.findByRole("option", { name: "Damaged" }));

    await attachEvidence(user);
    // TanStack Query hands the mutation its own context as a second argument,
    // so the payload is asserted positionally rather than on the whole call.
    expect(mockedUploadEvidence).toHaveBeenCalledTimes(1);
    expect(mockedUploadEvidence.mock.calls[0][0]).toEqual(
      expect.objectContaining({ factoryId: "FAC-001", file: expect.any(File) }),
    );

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));
    expect(await screen.findByRole("heading", { name: "Confirm Stock Adjustment" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm Adjustment" }));

    await vi.waitFor(() => expect(mockedCreateAdjustment).toHaveBeenCalledTimes(1));
    expect(mockedCreateAdjustment.mock.calls[0][0]).toEqual({
      factoryId: "FAC-001",
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      actualQuantity: 95,
      reasonCode: "DAMAGED",
      reason: undefined,
      evidenceIds: ["EV-1"],
    });
  });

  it("applies immediately on confirm — no pending or approval state is ever shown", async () => {
    const user = userEvent.setup();
    mockedCreateAdjustment.mockResolvedValue({
      movementId: "MV-ID-2",
      movementNumber: "MV-20260915-000009",
      factoryId: "FAC-001",
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      systemQuantity: 100,
      actualQuantity: 95,
      varianceQuantity: -5,
      reasonCode: "DAMAGED",
      reason: null,
      evidenceIds: ["EV-1"],
      countSessionId: null,
      createdAt: "2026-09-15T08:30:00.000Z",
    } satisfies AdjustmentResult);

    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);
    await user.click(screen.getByRole("combobox", { name: "Reason Code" }));
    await user.click(await screen.findByRole("option", { name: "Damaged" }));
    await attachEvidence(user);

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));
    await screen.findByRole("heading", { name: "Confirm Stock Adjustment" });
    await user.click(screen.getByRole("button", { name: "Confirm Adjustment" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("heading", { name: "New Adjustment" })).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Confirmation")).not.toBeInTheDocument();
  });

  it("surfaces a rejected evidence id inline rather than as a toast", async () => {
    const user = userEvent.setup();
    const badRequest = new AxiosError("Bad Request", "ERR_BAD_REQUEST");
    badRequest.response = {
      status: 400,
      data: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Every evidenceId must be a file you uploaded for this factory that no adjustment has used yet",
          details: [],
        },
      },
    } as AxiosResponse;
    mockedCreateAdjustment.mockRejectedValue(badRequest);

    renderWithQueryClient(<AdjustmentScreen />);
    await screen.findByText("MV-20260915-000003");
    await openCreateForm(user);
    await pickLocationAndNeedleType(user);
    await user.click(screen.getByRole("combobox", { name: "Reason Code" }));
    await user.click(await screen.findByRole("option", { name: "Damaged" }));
    await attachEvidence(user);

    await user.click(screen.getByRole("button", { name: "Review Adjustment" }));
    await screen.findByRole("heading", { name: "Confirm Stock Adjustment" });
    await user.click(screen.getByRole("button", { name: "Confirm Adjustment" }));

    expect(await screen.findByText(/Every evidenceId must be a file you uploaded/)).toBeInTheDocument();
  });
});
