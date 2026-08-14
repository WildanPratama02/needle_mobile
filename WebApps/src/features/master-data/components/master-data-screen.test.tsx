import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";

vi.mock("@/core/master-data/data-source", () => ({
  fetchMasterData: vi.fn(),
  fetchMasterDataRow: vi.fn(),
}));

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { NeedleTypeScreen, TrolleyScreen } = await import("./screens");

const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const NEEDLE = {
  id: "NDL-1",
  code: "DBX1",
  name: "Sewing Needle DBX1",
  status: "ACTIVE" as const,
  category: "Sewing",
  unit: "PCS",
  minimumStock: 50,
  description: null,
};

const TROLLEY = {
  id: "TRL-1",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  locationId: "LOC-1",
};

const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE" as const,
  description: null,
  timezone: "Asia/Jakarta",
};

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => {
    if (collection === "needle-types") return Promise.resolve([NEEDLE] as never);
    if (collection === "trolleys") return Promise.resolve([TROLLEY] as never);
    if (collection === "factories") return Promise.resolve([FACTORY] as never);
    return Promise.resolve([] as never);
  });
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Master data screens", () => {
  it("renders a catalogue with its type-specific columns", async () => {
    renderWithQueryClient(<NeedleTypeScreen />);

    expect(await screen.findByText("DBX1")).toBeInTheDocument();
    expect(screen.getByText("Sewing Needle DBX1")).toBeInTheDocument();
    expect(screen.getByText("PCS")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("resolves the factory id on a scoped collection to a name", async () => {
    renderWithQueryClient(<TrolleyScreen />);

    expect(await screen.findByText("TRL-A-01")).toBeInTheDocument();
    expect(await screen.findByText("Bandung Plant")).toBeInTheDocument();
  });

  /**
   * The backend is the boundary and would refuse anyway; hiding the screen
   * first means never firing a request that is known to 403.
   */
  it("refuses the screen to a caller without MASTER_VIEW", async () => {
    withPermissions(["EXCHANGE_VIEW"]);

    renderWithQueryClient(<NeedleTypeScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchMasterData).not.toHaveBeenCalled();
  });

  it("narrows a scoped collection to the selected factory", async () => {
    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });

    renderWithQueryClient(<TrolleyScreen />);
    await screen.findByText("TRL-A-01");

    expect(mockedFetchMasterData).toHaveBeenCalledWith("trolleys", { factoryId: "FAC-001" });
  });

  // Needle types carry no factoryId column at all — the backend rejects the
  // filter with a 400 rather than ignoring it, so the client must not send it.
  it("never sends a factory filter to a global catalogue", async () => {
    useFactoryScopeStore.setState({ selectedFactoryId: "FAC-001" });

    renderWithQueryClient(<NeedleTypeScreen />);
    await screen.findByText("DBX1");

    expect(mockedFetchMasterData).toHaveBeenCalledWith("needle-types", {});
  });

  it("reports an empty catalogue rather than an empty table", async () => {
    mockedFetchMasterData.mockImplementation(() => Promise.resolve([] as never));

    renderWithQueryClient(<NeedleTypeScreen />);

    expect(await screen.findByText("No needle types found.")).toBeInTheDocument();
  });
});
