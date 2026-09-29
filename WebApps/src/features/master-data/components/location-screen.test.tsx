import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { Factory, Location } from "@/core/master-data";

vi.mock("../api/location-data-source", () => ({
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
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

const { createLocation, updateLocation } = await import("../api/location-data-source");
const { fetchMasterData } = await import("@/core/master-data/data-source");
const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { LocationScreen } = await import("./location-screen");

const mockedCreate = vi.mocked(createLocation);
const mockedUpdate = vi.mocked(updateLocation);
const mockedFetchMasterData = vi.mocked(fetchMasterData);
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const FACTORY: Factory = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE",
  description: null,
  timezone: "Asia/Jakarta",
};

const WAREHOUSE: Location = {
  id: "LOC-WH",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "WAREHOUSE",
  parentLocationId: null,
};

/** A trolley's own location (ADR-003) — this screen must never offer to edit it. */
const TROLLEY_LOCATION: Location = {
  id: "LOC-TRL",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "TROLLEY",
  parentLocationId: null,
};

/**
 * Stands in for the endpoint, filters included: `GET /locations` applies
 * `locationType` itself (ticket 02), so a test that pretends otherwise would
 * pass against a screen that never sends the parameter.
 */
function masterDataFor(collection: string, query: { locationType?: string } = {}) {
  if (collection === "locations") {
    const rows = [WAREHOUSE, TROLLEY_LOCATION];
    return query.locationType ? rows.filter((row) => row.locationType === query.locationType) : rows;
  }
  if (collection === "factories") return [FACTORY];
  return [];
}

function withPermissions(permissions: string[]) {
  mockedFetchCurrentUser.mockResolvedValue({ ...MOCK_CURRENT_USER, permissions });
}

/** Shaped like a real failed request, so `axios.isAxiosError` and `getApiErrorMessage` behave as in the app. */
function apiError(status: number, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: {
      status,
      data: { success: false, error: { code: "ERROR", message, details: [] } },
    },
  });
}

beforeEach(() => {
  mockedCreate.mockReset();
  mockedUpdate.mockReset();
  mockedFetchMasterData.mockReset();
  mockedFetchCurrentUser.mockReset();
  mockedFetchMasterData.mockImplementation((collection: string, query) =>
    Promise.resolve(masterDataFor(collection, query as { locationType?: string }) as never),
  );
  withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW", "MASTER_EDIT"]);
  useSessionBootstrapStore.setState({ ready: true });
  useFactoryScopeStore.setState({ selectedFactoryId: "all" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LocationScreen", () => {
  describe("list states", () => {
    it("shows skeleton rows while the collection is in flight", async () => {
      mockedFetchMasterData.mockImplementation((collection: string) =>
        collection === "locations"
          ? new Promise(() => {})
          : Promise.resolve(masterDataFor(collection) as never),
      );

      const { container } = renderWithQueryClient(<LocationScreen />);

      await vi.waitFor(() =>
        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0),
      );
      expect(screen.queryByText("No locations in your scope.")).not.toBeInTheDocument();
    });

    it("reports an empty catalogue rather than an empty table", async () => {
      mockedFetchMasterData.mockImplementation((collection: string) =>
        Promise.resolve(collection === "locations" ? [] : (masterDataFor(collection) as never)),
      );

      renderWithQueryClient(<LocationScreen />);

      expect(await screen.findByText("No locations in your scope.")).toBeInTheDocument();
    });

    it("renders a failed read as a business-language error with a retry", async () => {
      mockedFetchMasterData.mockImplementation((collection: string) =>
        collection === "locations"
          ? Promise.reject(new Error("socket hang up"))
          : Promise.resolve(masterDataFor(collection) as never),
      );

      renderWithQueryClient(<LocationScreen />);

      expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      // Never the raw failure.
      expect(screen.queryByText(/socket hang up/)).not.toBeInTheDocument();
    });

    it("lists code, name and type for every location in scope", async () => {
      renderWithQueryClient(<LocationScreen />);

      expect(await screen.findByText("WH-01")).toBeInTheDocument();
      expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
      expect(screen.getByText("Warehouse")).toBeInTheDocument();
      expect(screen.getByText("TRL-A-01")).toBeInTheDocument();
      expect(screen.getByText("Trolley")).toBeInTheDocument();
    });
  });

  describe("permission gate", () => {
    it("refuses the screen without MASTER_VIEW", async () => {
      withPermissions([...MOCK_CURRENT_USER.permissions]);

      renderWithQueryClient(<LocationScreen />);

      expect(await screen.findByText("You do not have access to this resource.")).toBeInTheDocument();
      expect(screen.queryByText("WH-01")).not.toBeInTheDocument();
    });

    it("hides Create/Edit/Deactivate without MASTER_EDIT", async () => {
      withPermissions([...MOCK_CURRENT_USER.permissions, "MASTER_VIEW"]);

      renderWithQueryClient(<LocationScreen />);

      await screen.findByText("WH-01");
      expect(screen.queryByRole("button", { name: /New Location/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Deactivate/ })).not.toBeInTheDocument();
    });
  });

  describe("a trolley's own location", () => {
    it("offers no Edit, and says where it is managed instead", async () => {
      renderWithQueryClient(<LocationScreen />);

      await screen.findByText("TRL-A-01");
      expect(screen.getByText("Managed on the Trolley screen")).toBeInTheDocument();
      // Exactly one Edit button: the warehouse's.
      expect(screen.getAllByRole("button", { name: /Edit/ })).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("offers only the two creatable types — never TROLLEY", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /New Location/ }));
      const dialog = await screen.findByRole("dialog");

      await user.click(within(dialog).getByRole("combobox", { name: "Type" }));

      expect(await screen.findByRole("option", { name: "Warehouse" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Used Needle Storage" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Trolley" })).not.toBeInTheDocument();
    });

    it("posts the documented payload shape", async () => {
      const user = userEvent.setup();
      mockedCreate.mockResolvedValue({
        ...WAREHOUSE,
        id: "LOC-WH2",
        code: "WH-02",
        name: "Secondary Warehouse",
      });

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /New Location/ }));
      const dialog = await screen.findByRole("dialog");

      await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
      await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));

      await user.type(within(dialog).getByLabelText(/Location Code/), "WH-02");
      await user.type(within(dialog).getByLabelText(/Location Name/), "Secondary Warehouse");

      await user.click(within(dialog).getByRole("combobox", { name: "Type" }));
      await user.click(await screen.findByRole("option", { name: "Warehouse" }));

      await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

      await vi.waitFor(() => expect(mockedCreate).toHaveBeenCalled());
      expect(mockedCreate.mock.calls[0][0]).toEqual({
        factoryId: "FAC-001",
        code: "WH-02",
        name: "Secondary Warehouse",
        locationType: "WAREHOUSE",
        parentLocationId: undefined,
      });
    });

    it("refuses to submit without a type", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /New Location/ }));
      const dialog = await screen.findByRole("dialog");

      await user.type(within(dialog).getByLabelText(/Location Code/), "WH-02");
      await user.type(within(dialog).getByLabelText(/Location Name/), "Secondary Warehouse");
      await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

      expect(await within(dialog).findByText("Type is required")).toBeInTheDocument();
      expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("puts a duplicate-code 409 on the code field, not in a toast", async () => {
      const user = userEvent.setup();
      mockedCreate.mockRejectedValue(
        apiError(409, "Location code already in use in this factory: WH-01"),
      );

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /New Location/ }));
      const dialog = await screen.findByRole("dialog");

      await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
      await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
      await user.type(within(dialog).getByLabelText(/Location Code/), "WH-01");
      await user.type(within(dialog).getByLabelText(/Location Name/), "Duplicate");
      await user.click(within(dialog).getByRole("combobox", { name: "Type" }));
      await user.click(await screen.findByRole("option", { name: "Warehouse" }));

      await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

      const codeField = within(dialog).getByLabelText(/Location Code/);
      const message = await within(dialog).findByText(
        "Location code already in use in this factory: WH-01",
      );
      expect(message).toBeInTheDocument();
      // Inline on the offending field: the input points at the message that describes it.
      expect(codeField).toHaveAttribute("aria-invalid", "true");
      expect(codeField.getAttribute("aria-describedby")).toContain(message.id);
    });

    it("puts an inactive-factory 400 on the factory field", async () => {
      const user = userEvent.setup();
      mockedCreate.mockRejectedValue(apiError(400, "factoryId must be ACTIVE"));

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /New Location/ }));
      const dialog = await screen.findByRole("dialog");

      await user.click(within(dialog).getByRole("combobox", { name: "Factory" }));
      await user.click(await screen.findByRole("option", { name: /Bandung Plant/ }));
      await user.type(within(dialog).getByLabelText(/Location Code/), "WH-03");
      await user.type(within(dialog).getByLabelText(/Location Name/), "Third Warehouse");
      await user.click(within(dialog).getByRole("combobox", { name: "Type" }));
      await user.click(await screen.findByRole("option", { name: "Warehouse" }));

      await user.click(within(dialog).getByRole("button", { name: "Create Location" }));

      expect(await within(dialog).findByText("factoryId must be ACTIVE")).toBeInTheDocument();
      expect(within(dialog).getByRole("combobox", { name: "Factory" })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
  });

  describe("edit", () => {
    it("shows code and type but does not let them change, and says why", async () => {
      const user = userEvent.setup();
      mockedUpdate.mockResolvedValue({ ...WAREHOUSE, name: "Renamed Warehouse" });

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /Edit/ }));
      const dialog = await screen.findByRole("dialog");

      expect(within(dialog).getByDisplayValue("WH-01")).toBeDisabled();
      // Type is visible, as text — never an editable control.
      expect(within(dialog).getByText("Warehouse")).toBeInTheDocument();
      expect(within(dialog).queryByRole("combobox", { name: "Type" })).not.toBeInTheDocument();
      expect(within(dialog).getByText(/every stock movement points at this row/)).toBeInTheDocument();

      const nameField = within(dialog).getByLabelText(/Location Name/);
      await user.clear(nameField);
      await user.type(nameField, "Renamed Warehouse");

      await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

      await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
      // `code` and `locationType` are absent from the payload, not just from the form.
      expect(mockedUpdate.mock.calls[0]).toEqual([
        "LOC-WH",
        { name: "Renamed Warehouse", parentLocationId: undefined, status: "ACTIVE" },
      ]);
    });

    it("deactivates through the confirm dialog, using PATCH status", async () => {
      const user = userEvent.setup();
      mockedUpdate.mockResolvedValue({ ...WAREHOUSE, status: "INACTIVE" });

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("button", { name: /Deactivate/ }));
      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByText(/Movements already recorded against it stay readable/),
      ).toBeInTheDocument();

      await user.click(within(dialog).getByRole("button", { name: "Confirm Deactivation" }));

      await vi.waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
      expect(mockedUpdate.mock.calls[0]).toEqual(["LOC-WH", { status: "INACTIVE" }]);
    });
  });

  describe("filters", () => {
    it("asks the endpoint for the type filter instead of narrowing rows on screen", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("TRL-A-01");

      await user.click(screen.getByRole("combobox", { name: "Filter by Type" }));
      await user.click(await screen.findByRole("option", { name: "Warehouse" }));

      await vi.waitFor(() => expect(screen.queryByText("TRL-A-01")).not.toBeInTheDocument());
      expect(screen.getByText("WH-01")).toBeInTheDocument();

      // The narrowing is the request's, not a pass over a fetched page — a
      // server-paged slice filtered here would silently hide rows.
      await vi.waitFor(() =>
        expect(mockedFetchMasterData).toHaveBeenCalledWith(
          "locations",
          expect.objectContaining({ locationType: "WAREHOUSE" }),
        ),
      );
    });

    it("counts the filtered set, not the whole catalogue", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<LocationScreen />);
      expect(await screen.findByText("Showing 1–2 of 2")).toBeInTheDocument();

      await user.click(screen.getByRole("combobox", { name: "Filter by Type" }));
      await user.click(await screen.findByRole("option", { name: "Warehouse" }));

      // The count is the filtered set's, never the catalogue's.
      expect(await screen.findByText("Showing 1–1 of 1")).toBeInTheDocument();
    });

    it("drops locationType from the query when the filter goes back to all types", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("TRL-A-01");

      await user.click(screen.getByRole("combobox", { name: "Filter by Type" }));
      await user.click(await screen.findByRole("option", { name: "Warehouse" }));
      await vi.waitFor(() => expect(screen.queryByText("TRL-A-01")).not.toBeInTheDocument());

      await user.click(screen.getByRole("combobox", { name: "Filter by Type" }));
      await user.click(await screen.findByRole("option", { name: "All Types" }));

      // Back to the unfiltered query — served from its own still-fresh cache
      // entry, which is why the type split in the key is not a regression.
      expect(await screen.findByText("TRL-A-01")).toBeInTheDocument();

      for (const [collection, query] of mockedFetchMasterData.mock.calls) {
        if (collection !== "locations") continue;
        const locationType = (query as { locationType?: string } | undefined)?.locationType;
        // The "all" sentinel is a UI value, never a value the endpoint would
        // accept — it is dropped, not sent.
        expect(locationType === undefined || locationType === "WAREHOUSE").toBe(true);
      }
      expect(mockedFetchMasterData).toHaveBeenCalledWith("locations", { locationType: "WAREHOUSE" });
    });

    it("asks the endpoint for the status filter it does contract", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<LocationScreen />);
      await screen.findByText("WH-01");

      await user.click(screen.getByRole("combobox", { name: "Filter by Status" }));
      await user.click(await screen.findByRole("option", { name: "Inactive" }));

      await vi.waitFor(() =>
        expect(
          mockedFetchMasterData.mock.calls.some(
            ([collection, query]) =>
              collection === "locations" &&
              (query as { status?: string } | undefined)?.status === "INACTIVE",
          ),
        ).toBe(true),
      );
    });
  });
});
