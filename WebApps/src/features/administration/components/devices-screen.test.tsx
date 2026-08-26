import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { useDeviceFilterStore } from "../store";
import type { Device, PagedDevices } from "../api/device-types";

vi.mock("../api/device-data-source", () => ({
  fetchDevices: vi.fn(),
  registerDevice: vi.fn(),
  activateDevice: vi.fn(),
  revokeDevice: vi.fn(),
  reassignDevice: vi.fn(),
  fetchDevice: vi.fn(),
}));

vi.mock("@/core/master-data/data-source", () => ({
  fetchMasterData: vi.fn(),
  fetchMasterDataRow: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/administration/devices",
}));

const { fetchDevices } = await import("../api/device-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { DevicesScreen } = await import("./devices-screen");

const mockedFetchDevices = vi.mocked(fetchDevices);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: "DEV-1",
    deviceCode: "DEV-001",
    deviceName: "Trolley A-01 Tablet",
    serialNumber: "SN-0001",
    factoryId: "FAC-001",
    trolleyId: "TRL-001",
    status: "ACTIVE",
    appVersion: "1.2.0",
    lastSeenAt: "2026-08-20T08:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePaged(overrides: Partial<PagedDevices> = {}): PagedDevices {
  return { items: [makeDevice()], page: 1, pageSize: 20, total: 1, totalPages: 1, ...overrides };
}

function axiosError(status: number, message: string) {
  const error = new Error(message) as Error & { isAxiosError: boolean; response: unknown };
  error.isAxiosError = true;
  error.response = { status, data: { error: { message } } };
  return error;
}

beforeEach(() => {
  mockedFetchDevices.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchMasterData.mockResolvedValue([]);
  useDeviceFilterStore.setState({ trolleyId: "", status: "ALL", page: 1, pageSize: 20 });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
  useSessionBootstrapStore.setState({ ready: true });
  mockedFetchCurrentUser.mockResolvedValue(MOCK_CURRENT_USER);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DevicesScreen", () => {
  it("renders populated rows as returned by the backend", async () => {
    mockedFetchDevices.mockResolvedValue(makePaged());

    renderWithQueryClient(<DevicesScreen />);

    expect(await screen.findByText("DEV-001")).toBeInTheDocument();
    expect(screen.getByText("Trolley A-01 Tablet")).toBeInTheDocument();
  });

  it("renders an EmptyState when there are no rows", async () => {
    mockedFetchDevices.mockResolvedValue(makePaged({ items: [], total: 0 }));

    renderWithQueryClient(<DevicesScreen />);

    expect(await screen.findByText("No devices found.")).toBeInTheDocument();
  });

  it("renders an ErrorState with Retry for a non-403 error", async () => {
    const user = userEvent.setup();
    mockedFetchDevices.mockRejectedValueOnce(axiosError(500, "Internal error."));
    mockedFetchDevices.mockResolvedValueOnce(makePaged());

    renderWithQueryClient(<DevicesScreen />);

    expect(await screen.findByText("Internal error.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("DEV-001")).toBeInTheDocument();
  });

  it("shows an access-denied state with no Retry button on a 403", async () => {
    mockedFetchDevices.mockRejectedValue(axiosError(403, "Missing DEVICE_MANAGE"));

    renderWithQueryClient(<DevicesScreen />);

    expect(await screen.findByText("Missing DEVICE_MANAGE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("skips the request entirely and shows access-denied when the real session has no DEVICE_MANAGE", async () => {
    mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions: ["DASHBOARD_VIEW"] });

    renderWithQueryClient(<DevicesScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchDevices).not.toHaveBeenCalled();
  });

  it("requests the next page and preserves the active filters", async () => {
    const user = userEvent.setup();
    mockedFetchDevices.mockResolvedValue(makePaged({ totalPages: 3, total: 50 }));

    renderWithQueryClient(<DevicesScreen />);
    await screen.findByText("DEV-001");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    await vi.waitFor(() => {
      expect(mockedFetchDevices).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it("requests the caller-scoped factory when TopBar's Factory selector isn't 'all'", async () => {
    mockedFetchDevices.mockResolvedValue(makePaged());
    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-002" });

    renderWithQueryClient(<DevicesScreen />);

    await vi.waitFor(() => {
      expect(mockedFetchDevices).toHaveBeenCalledWith(expect.objectContaining({ factoryId: "FAC-002" }));
    });
  });

  it("offers Activate for a REVOKED device and Revoke for an ACTIVE one, never both at once", async () => {
    mockedFetchDevices.mockResolvedValue(
      makePaged({
        items: [makeDevice({ id: "DEV-1", deviceCode: "DEV-001", status: "ACTIVE" })],
      }),
    );

    renderWithQueryClient(<DevicesScreen />);
    const row = (await screen.findByText("DEV-001")).closest("tr");
    expect(row).not.toBeNull();

    expect(within(row as HTMLElement).getByRole("button", { name: /Revoke/ })).toBeInTheDocument();
    expect(within(row as HTMLElement).queryByRole("button", { name: /Activate/ })).not.toBeInTheDocument();
    expect(within(row as HTMLElement).getByRole("button", { name: /Reassign/ })).toBeInTheDocument();
  });

  it("opens the Register dialog and does not submit until the required fields are filled", async () => {
    const user = userEvent.setup();
    mockedFetchDevices.mockResolvedValue(makePaged());

    renderWithQueryClient(<DevicesScreen />);
    await screen.findByText("DEV-001");

    await user.click(screen.getByRole("button", { name: "Register Device" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Register Device" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Register Device" }));

    expect(await screen.findByText("Device ID is required")).toBeInTheDocument();
  });

  it("revoking a device sends POST /devices/:id/revoke and never calls heartbeat", async () => {
    const user = userEvent.setup();
    mockedFetchDevices.mockResolvedValue(
      makePaged({ items: [makeDevice({ id: "DEV-1", deviceCode: "DEV-001", status: "ACTIVE" })] }),
    );
    const { revokeDevice } = await import("../api/device-data-source");
    vi.mocked(revokeDevice).mockResolvedValue(makeDevice({ status: "REVOKED" }));

    renderWithQueryClient(<DevicesScreen />);
    const row = (await screen.findByText("DEV-001")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /Revoke/ }));
    expect(screen.getByRole("heading", { name: "Revoke Device" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Revocation" }));

    await vi.waitFor(() => {
      expect(revokeDevice).toHaveBeenCalledWith("DEV-1", "");
    });

    const { fetchDevice } = await import("../api/device-data-source");
    expect(fetchDevice).not.toHaveBeenCalled();
  });

  it("reassigning without changing anything resubmits the device's own current factory/trolley — the prefill is not wiped by the cascading-clear effect", async () => {
    const user = userEvent.setup();
    mockedFetchDevices.mockResolvedValue(
      makePaged({
        items: [makeDevice({ id: "DEV-1", deviceCode: "DEV-001", factoryId: "FAC-001", trolleyId: "TRL-001" })],
      }),
    );
    mockedFetchMasterData.mockImplementation(async (collection: string) => {
      if (collection === "trolleys") {
        return [{ id: "TRL-001", code: "TRL-001", name: "Trolley 01", status: "ACTIVE", factoryId: "FAC-001", locationId: "LOC-001" }];
      }
      return [];
    });
    const { reassignDevice } = await import("../api/device-data-source");
    vi.mocked(reassignDevice).mockResolvedValue(makeDevice());

    renderWithQueryClient(<DevicesScreen />);
    const row = (await screen.findByText("DEV-001")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /Reassign/ }));
    expect(screen.getByRole("heading", { name: "Reassign Device" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Reassignment" }));

    await vi.waitFor(() => {
      expect(reassignDevice).toHaveBeenCalledWith("DEV-1", { factoryId: "FAC-001", trolleyId: "TRL-001" });
    });
  });
});
