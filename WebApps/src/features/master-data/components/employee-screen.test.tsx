import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";

vi.mock("../api/employee-data-source", () => ({
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
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

const { createEmployee } = await import("../api/employee-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { EmployeeScreen } = await import("./employee-screen");

const mockedCreateEmployee = vi.mocked(createEmployee);
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

const EMPLOYEE = {
  id: "EMP-1",
  code: "EMP-0001",
  name: "Siti Operator",
  status: "ACTIVE" as const,
  factoryId: "FAC-001",
  employeeNumber: "EMP-0001",
  department: "Sewing Line 1",
};

function masterDataFor(collection: string) {
  if (collection === "factories") return [FACTORY];
  if (collection === "employees") return [EMPLOYEE];
  return [];
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedCreateEmployee.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) => Promise.resolve(masterDataFor(collection) as never));
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EmployeeScreen", () => {
  it("refuses the screen to a caller without MASTER_VIEW", async () => {
    withPermissions(["DASHBOARD_VIEW"]);

    renderWithQueryClient(<EmployeeScreen />);

    expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
    expect(mockedFetchMasterData).not.toHaveBeenCalled();
  });

  it("lists employees, and hides the write actions without MASTER_EDIT", async () => {
    withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

    renderWithQueryClient(<EmployeeScreen />);

    expect(await screen.findByText("EMP-0001")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New Employee" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("reports an empty scope rather than an empty table", async () => {
    mockedFetchMasterData.mockImplementation((collection: string) =>
      Promise.resolve(collection === "factories" ? [FACTORY] : ([] as never)),
    );

    renderWithQueryClient(<EmployeeScreen />);

    expect(await screen.findByText("No employees in your scope.")).toBeInTheDocument();
  });

  it("creates an employee with no RFID scan", async () => {
    const user = userEvent.setup();
    mockedCreateEmployee.mockResolvedValue({ ...EMPLOYEE, id: "EMP-2", employeeNumber: "EMP-0002" });

    renderWithQueryClient(<EmployeeScreen />);
    await screen.findByText("EMP-0001");

    await user.click(screen.getByRole("button", { name: "New Employee" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Employee ID *"), "EMP-0002");
    await user.type(within(dialog).getByLabelText("Name *"), "Budi Operator");
    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

    await user.click(within(dialog).getByRole("button", { name: "Create Employee" }));

    await vi.waitFor(() => {
      expect(mockedCreateEmployee).toHaveBeenCalled();
    });
    expect(mockedCreateEmployee.mock.calls[0][0]).toEqual({
      employeeNumber: "EMP-0002",
      name: "Budi Operator",
      department: undefined,
      factoryId: "FAC-001",
      rfidUid: undefined,
    });
  });

  it("creates an employee with an inline RFID scan", async () => {
    const user = userEvent.setup();
    mockedCreateEmployee.mockResolvedValue({ ...EMPLOYEE, id: "EMP-2", employeeNumber: "EMP-0002" });

    renderWithQueryClient(<EmployeeScreen />);
    await screen.findByText("EMP-0001");

    await user.click(screen.getByRole("button", { name: "New Employee" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Employee ID *"), "EMP-0002");
    await user.type(within(dialog).getByLabelText("Name *"), "Budi Operator");
    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.type(within(dialog).getByLabelText("Scan RFID Card (optional)"), "RFID999");

    await user.click(within(dialog).getByRole("button", { name: "Create Employee" }));

    await vi.waitFor(() => {
      expect(mockedCreateEmployee).toHaveBeenCalled();
    });
    expect(mockedCreateEmployee.mock.calls[0][0]).toEqual(
      expect.objectContaining({ rfidUid: "RFID999" }),
    );
  });

  it("shows the duplicate employeeNumber conflict inline, distinct from an RFID conflict", async () => {
    const user = userEvent.setup();
    mockedCreateEmployee.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          error: { message: "Employee number already in use: EMP-0001", code: "CONFLICT", details: [] },
        },
      },
    });

    renderWithQueryClient(<EmployeeScreen />);
    await screen.findByText("EMP-0001");

    await user.click(screen.getByRole("button", { name: "New Employee" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Employee ID *"), "EMP-0001");
    await user.type(within(dialog).getByLabelText("Name *"), "Budi Operator");
    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

    await user.click(within(dialog).getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByText(/Employee number already in use/)).toBeInTheDocument();
    // Rendered on the employeeNumber field, not the RFID field.
    expect(within(dialog).queryByText(/already assigned to/)).not.toBeInTheDocument();
  });

  it("shows the RFID-already-assigned conflict inline, distinct from an employeeNumber conflict", async () => {
    const user = userEvent.setup();
    mockedCreateEmployee.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            message: "RFID RFID999 is already assigned to Ani (EMP-0009)",
            code: "CONFLICT",
            details: [],
          },
        },
      },
    });

    renderWithQueryClient(<EmployeeScreen />);
    await screen.findByText("EMP-0001");

    await user.click(screen.getByRole("button", { name: "New Employee" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Employee ID *"), "EMP-0002");
    await user.type(within(dialog).getByLabelText("Name *"), "Budi Operator");
    await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
    await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
    await user.type(within(dialog).getByLabelText("Scan RFID Card (optional)"), "RFID999");

    await user.click(within(dialog).getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByText(/already assigned to Ani/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Employee number already in use/)).not.toBeInTheDocument();
  });

  it("renders employeeNumber and Factory as read-only in the edit dialog", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<EmployeeScreen />);
    await screen.findByText("EMP-0001");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByDisplayValue("EMP-0001")).toBeDisabled();
    expect(within(dialog).queryByRole("combobox", { name: "Factory" })).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("Name *")).toHaveValue("Siti Operator");
    expect(within(dialog).getByRole("combobox", { name: "Status" })).toBeInTheDocument();
  });
});
