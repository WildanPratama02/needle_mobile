import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { NeedleType } from "@/core/master-data";

vi.mock("../api/needle-type-data-source", () => ({
  createNeedleType: vi.fn(),
  updateNeedleType: vi.fn(),
  activateNeedleType: vi.fn(),
  deactivateNeedleType: vi.fn(),
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

const { createNeedleType, updateNeedleType, deactivateNeedleType } = await import("../api/needle-type-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { NeedleTypeScreen } = await import("./needle-type-screen");

const mockedCreate = vi.mocked(createNeedleType);
const mockedUpdate = vi.mocked(updateNeedleType);
const mockedDeactivate = vi.mocked(deactivateNeedleType);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const NEEDLE: NeedleType = {
  id: "NDL-1",
  code: "DBX1",
  name: "Sewing Needle DBX1",
  status: "ACTIVE",
  category: "Sewing",
  unit: "PCS",
  minimumStock: 50,
  description: null,
};

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedCreate.mockReset();
  mockedUpdate.mockReset();
  mockedDeactivate.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) =>
    Promise.resolve(collection === "needle-types" ? [NEEDLE] : ([] as never)),
  );
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NeedleTypeScreen", () => {
  it("refuses the screen to a caller without MASTER_VIEW", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<NeedleTypeScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchMasterData).not.toHaveBeenCalled();
  });

  it("reports an empty catalogue rather than an empty table", async () => {
    mockedFetchMasterData.mockImplementation(() => Promise.resolve([] as never));

    renderWithQueryClient(<NeedleTypeScreen />);

    expect(await screen.findByText("No needle types found.")).toBeInTheDocument();
  });

  it("hides Create/Edit/Deactivate without MASTER_EDIT", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

    renderWithQueryClient(<NeedleTypeScreen />);

    await screen.findByText("DBX1");
    expect(screen.queryByRole("button", { name: /New Needle Type/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Deactivate/ })).not.toBeInTheDocument();
  });

  it("creates a needle type with the documented payload shape", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue(NEEDLE);

    renderWithQueryClient(<NeedleTypeScreen />);
    await screen.findByText("DBX1");

    await user.click(screen.getByRole("button", { name: /New Needle Type/ }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText(/Code/), "DBX2");
    await user.type(within(dialog).getByLabelText(/Name/), "Sewing Needle DBX2");
    await user.type(within(dialog).getByLabelText(/Unit/), "PCS");
    const minStock = within(dialog).getByLabelText(/Minimum Stock/);
    await user.clear(minStock);
    await user.type(minStock, "25");

    await user.click(within(dialog).getByRole("button", { name: "Create Needle Type" }));

    await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(mockedCreate.mock.calls[0][0]).toEqual({
      code: "DBX2",
      name: "Sewing Needle DBX2",
      category: undefined,
      unit: "PCS",
      minimumStock: 25,
      description: undefined,
    });
  });

  it("surfaces a duplicate-code 409 on the code field", async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { success: false, error: { message: "Needle type code already exists", code: "CONFLICT", details: [] } },
      },
    });

    renderWithQueryClient(<NeedleTypeScreen />);
    await screen.findByText("DBX1");

    await user.click(screen.getByRole("button", { name: /New Needle Type/ }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Code/), "DBX1");
    await user.type(within(dialog).getByLabelText(/Name/), "Dup");
    await user.type(within(dialog).getByLabelText(/Unit/), "PCS");

    await user.click(within(dialog).getByRole("button", { name: "Create Needle Type" }));

    expect(await screen.findByText("Needle type code already exists")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the code field read-only in edit mode and submits without it", async () => {
    const user = userEvent.setup();
    mockedUpdate.mockResolvedValue({ ...NEEDLE, name: "Renamed" });

    renderWithQueryClient(<NeedleTypeScreen />);
    await screen.findByText("DBX1");

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");

    const codeField = within(dialog).getByDisplayValue("DBX1");
    expect(codeField).toBeDisabled();

    const nameField = within(dialog).getByLabelText(/Name/);
    await user.clear(nameField);
    await user.type(nameField, "Renamed");

    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate.mock.calls[0]).toEqual([
      "NDL-1",
      { name: "Renamed", category: "Sewing", unit: "PCS", minimumStock: 50, description: undefined },
    ]);
  });

  it("deactivates a needle type through the confirm dialog", async () => {
    const user = userEvent.setup();
    mockedDeactivate.mockResolvedValue({ ...NEEDLE, status: "INACTIVE" });

    renderWithQueryClient(<NeedleTypeScreen />);
    await screen.findByText("DBX1");

    await user.click(screen.getByRole("button", { name: /Deactivate/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm Deactivation" }));

    await vi.waitFor(() => expect(mockedDeactivate).toHaveBeenCalledWith("NDL-1"));
  });
});
