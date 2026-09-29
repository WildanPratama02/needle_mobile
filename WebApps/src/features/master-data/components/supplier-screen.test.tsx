import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { Supplier } from "@/core/master-data";

vi.mock("../api/supplier-data-source", () => ({
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
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

const { createSupplier, updateSupplier } = await import("../api/supplier-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { SupplierScreen } = await import("./supplier-screen");

const mockedCreate = vi.mocked(createSupplier);
const mockedUpdate = vi.mocked(updateSupplier);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const SUPPLIER: Supplier = {
  id: "SUP-1",
  code: "SUP-001",
  name: "PT Jarum Makmur",
  contact: "sales@jarummakmur.co.id",
  description: "Primary needle supplier",
};

/** A row with both optional fields empty — the null-rendering path. */
const SPARSE_SUPPLIER: Supplier = {
  id: "SUP-2",
  code: "SUP-002",
  name: "CV Sumber Jarum",
  contact: null,
  description: null,
};

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

beforeEach(() => {
  mockedCreate.mockReset();
  mockedUpdate.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string) =>
    Promise.resolve(collection === "suppliers" ? [SUPPLIER, SPARSE_SUPPLIER] : ([] as never)),
  );
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SupplierScreen", () => {
  describe("list states", () => {
    it("shows skeleton rows while the collection is in flight", async () => {
      mockedFetchMasterData.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithQueryClient(<SupplierScreen />);

      await vi.waitFor(() =>
        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0),
      );
      expect(screen.queryByText("No suppliers found.")).not.toBeInTheDocument();
    });

    it("reports an empty catalogue rather than an empty table", async () => {
      mockedFetchMasterData.mockImplementation(() => Promise.resolve([] as never));

      renderWithQueryClient(<SupplierScreen />);

      expect(await screen.findByText("No suppliers found.")).toBeInTheDocument();
    });

    it("renders a failed read as a business-language error with a retry", async () => {
      mockedFetchMasterData.mockImplementation(() => Promise.reject(new Error("socket hang up")));

      renderWithQueryClient(<SupplierScreen />);

      expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      // Never the raw failure.
      expect(screen.queryByText(/socket hang up/)).not.toBeInTheDocument();
    });

    it("lists code, name, contact and description for every supplier", async () => {
      renderWithQueryClient(<SupplierScreen />);

      expect(await screen.findByText("SUP-001")).toBeInTheDocument();
      expect(screen.getByText("PT Jarum Makmur")).toBeInTheDocument();
      expect(screen.getByText("sales@jarummakmur.co.id")).toBeInTheDocument();
      expect(screen.getByText("Primary needle supplier")).toBeInTheDocument();
      expect(screen.getByText("SUP-002")).toBeInTheDocument();
      expect(screen.getByText("CV Sumber Jarum")).toBeInTheDocument();
    });
  });

  describe("no lifecycle", () => {
    /**
     * `.scratch/receiving-supplier/spec.md` decision 6: a supplier is never
     * deactivated. Every sibling collection has an `EntityStatus`, so these
     * assertions exist to make the absence fail loudly if somebody adds one
     * "for consistency".
     */
    it("offers no status column and no activate/deactivate action", async () => {
      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      expect(screen.queryByRole("columnheader", { name: /Status/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Deactivate/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Activate/i })).not.toBeInTheDocument();
      expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
      expect(screen.queryByText("INACTIVE")).not.toBeInTheDocument();
    });

    it("never sends status or factoryId to /suppliers", async () => {
      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      expect(mockedFetchMasterData).toHaveBeenCalled();
      for (const [collection, query] of mockedFetchMasterData.mock.calls) {
        expect(collection).toBe("suppliers");
        // The endpoint answers either filter with a 400 — the screen must not
        // offer one, and must not pass one through either.
        expect(query ?? {}).toEqual({});
      }
    });

    it("offers no filter controls at all", async () => {
      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  describe("permissions", () => {
    it("refuses the screen to a caller without MASTER_VIEW", async () => {
      withPermissions(["DASHBOARD_VIEW"]);

      renderWithQueryClient(<SupplierScreen />);

      expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
      expect(mockedFetchMasterData).not.toHaveBeenCalled();
    });

    it("hides Create and Edit without MASTER_EDIT", async () => {
      withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

      renderWithQueryClient(<SupplierScreen />);

      await screen.findByText("SUP-001");
      expect(screen.queryByRole("button", { name: /New Supplier/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    });
  });

  describe("create", () => {
    it("creates a supplier with the documented payload shape", async () => {
      const user = userEvent.setup();
      mockedCreate.mockResolvedValue(SUPPLIER);

      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      await user.click(screen.getByRole("button", { name: /New Supplier/ }));
      const dialog = await screen.findByRole("dialog");

      await user.type(within(dialog).getByLabelText(/Code/), "SUP-003");
      await user.type(within(dialog).getByLabelText(/Name/), "PT Jarum Baru");
      await user.type(within(dialog).getByLabelText(/Contact/), "0812-0000-0000");

      await user.click(within(dialog).getByRole("button", { name: "Create Supplier" }));

      await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
      expect(mockedCreate.mock.calls[0][0]).toEqual({
        code: "SUP-003",
        name: "PT Jarum Baru",
        contact: "0812-0000-0000",
        description: undefined,
      });
      // No status on the way out — `CreateSupplierDto` has no such field.
      expect(mockedCreate.mock.calls[0][0]).not.toHaveProperty("status");
    });

    it("refuses a blank code and a blank name before any request goes out", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      await user.click(screen.getByRole("button", { name: /New Supplier/ }));
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Create Supplier" }));

      expect(await within(dialog).findByText("Code is required")).toBeInTheDocument();
      expect(within(dialog).getByText("Name is required")).toBeInTheDocument();
      expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("surfaces a duplicate-code 409 on the code field, not as a toast", async () => {
      const user = userEvent.setup();
      mockedCreate.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            success: false,
            error: { message: "Supplier code SUP-001 already exists", code: "CONFLICT", details: [] },
          },
        },
      });

      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      await user.click(screen.getByRole("button", { name: /New Supplier/ }));
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText(/Code/), "SUP-001");
      await user.type(within(dialog).getByLabelText(/Name/), "Duplicate");

      await user.click(within(dialog).getByRole("button", { name: "Create Supplier" }));

      const codeField = within(dialog).getByLabelText(/Code/);
      const message = await screen.findByText("Supplier code SUP-001 already exists");
      expect(message).toBeInTheDocument();
      // Bound to the field, so the reader is told *which* input is wrong.
      expect(codeField).toHaveAttribute("aria-describedby", expect.stringContaining(message.id));
      // The dialog stays open with the rest of the input intact.
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Name/)).toHaveValue("Duplicate");
    });
  });

  describe("edit", () => {
    it("renders the code read-only, states why, and submits without it", async () => {
      const user = userEvent.setup();
      mockedUpdate.mockResolvedValue({ ...SUPPLIER, name: "PT Jarum Makmur Sejahtera" });

      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      await user.click(screen.getAllByRole("button", { name: /Edit/ })[0]);
      const dialog = await screen.findByRole("dialog");

      const codeField = within(dialog).getByDisplayValue("SUP-001");
      expect(codeField).toBeDisabled();
      expect(within(dialog).getByText(/Code cannot change after creation/)).toBeInTheDocument();

      const nameField = within(dialog).getByLabelText(/Name/);
      await user.clear(nameField);
      await user.type(nameField, "PT Jarum Makmur Sejahtera");

      await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

      await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
      expect(mockedUpdate.mock.calls[0]).toEqual([
        "SUP-1",
        {
          name: "PT Jarum Makmur Sejahtera",
          contact: "sales@jarummakmur.co.id",
          description: "Primary needle supplier",
        },
      ]);
      expect(mockedUpdate.mock.calls[0][1]).not.toHaveProperty("code");
      expect(mockedUpdate.mock.calls[0][1]).not.toHaveProperty("status");
    });

    it("clears an optional field by sending it as absent rather than as an empty string", async () => {
      const user = userEvent.setup();
      mockedUpdate.mockResolvedValue({ ...SUPPLIER, contact: null });

      renderWithQueryClient(<SupplierScreen />);
      await screen.findByText("SUP-001");

      await user.click(screen.getAllByRole("button", { name: /Edit/ })[0]);
      const dialog = await screen.findByRole("dialog");

      await user.clear(within(dialog).getByLabelText(/Contact/));
      await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

      await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
      expect(mockedUpdate.mock.calls[0][1].contact).toBeUndefined();
    });
  });
});
