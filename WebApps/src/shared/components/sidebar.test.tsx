import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PERMISSIONS } from "@/core/permissions";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import { MOCK_CURRENT_USER } from "@/shared/test-utils/mock-current-user";
import { renderWithQueryClient } from "@/shared/test-utils/render-with-query-client";

vi.mock("@/core/auth/data-source", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
}));

const { fetchCurrentUser } = await import("@/core/auth/data-source");
const { Sidebar } = await import("./sidebar");
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

/**
 * The seeded role grants from `Backend/src/shared/constants/roles.ts`. These
 * are what a real session carries, so the menus asserted below are the menus
 * real users see.
 */
const ROLE_PERMISSIONS = {
  PIC_TROLI: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXCHANGE_VIEW,
    PERMISSIONS.EXCHANGE_CREATE,
    PERMISSIONS.EXCHANGE_ISSUE,
    PERMISSIONS.EXCHANGE_COMPLETE,
    PERMISSIONS.EXCHANGE_CANCEL,
    PERMISSIONS.CONFIRMATION_VIEW,
    PERMISSIONS.STOCK_VIEW,
  ],
  PIC_INVENTORY: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_RECEIVE,
    PERMISSIONS.STOCK_TRANSFER,
    PERMISSIONS.STOCK_RETURN,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_COUNT,
    PERMISSIONS.MASTER_VIEW,
  ],
  MANAGEMENT: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXCHANGE_VIEW,
    PERMISSIONS.CONFIRMATION_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.AUDIT_VIEW,
  ],
  APPROVER: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXCHANGE_VIEW,
    PERMISSIONS.CONFIRMATION_VIEW,
    PERMISSIONS.CONFIRMATION_APPROVE,
    PERMISSIONS.CONFIRMATION_REJECT,
  ],
  SYSTEM_ADMIN: Object.values(PERMISSIONS),
} as const;

function signInAs(role: keyof typeof ROLE_PERMISSIONS) {
  mockedFetchCurrentUser.mockResolvedValue({
    ...MOCK_CURRENT_USER,
    roles: [role],
    permissions: [...ROLE_PERMISSIONS[role]],
  });
}

beforeEach(() => {
  mockedFetchCurrentUser.mockReset();
  useSessionBootstrapStore.setState({ ready: true });
  signInAs("SYSTEM_ADMIN");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sidebar visibility", () => {
  describe("per role", () => {
    it("shows a System Admin every built screen", async () => {
      signInAs("SYSTEM_ADMIN");
      renderWithQueryClient(<Sidebar />);

      expect(await screen.findByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Exchange Transactions")).toBeInTheDocument();
      expect(screen.getByText("Confirmation")).toBeInTheDocument();
      expect(screen.getByText("Needle Type")).toBeInTheDocument();
      expect(screen.getByText("Audit Log")).toBeInTheDocument();
    });

    /**
     * The case that motivated this work: PIC_TROLI holds neither MASTER_VIEW
     * nor AUDIT_VIEW, so before permission filtering they were shown six
     * screens that 403 on click.
     */
    it("hides Master Data and Audit Log from a PIC Troli", async () => {
      signInAs("PIC_TROLI");
      renderWithQueryClient(<Sidebar />);

      expect(await screen.findByText("Exchange Transactions")).toBeInTheDocument();
      expect(screen.getByText("Confirmation")).toBeInTheDocument();

      expect(screen.queryByText("Needle Type")).not.toBeInTheDocument();
      expect(screen.queryByText("Factory")).not.toBeInTheDocument();
      expect(screen.queryByText("Employee")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
    });

    it("hides Transactions from a PIC Inventory and keeps Master Data", async () => {
      signInAs("PIC_INVENTORY");
      renderWithQueryClient(<Sidebar />);

      expect(await screen.findByText("Needle Type")).toBeInTheDocument();
      expect(screen.getByText("Stock Overview")).toBeInTheDocument();

      expect(screen.queryByText("Exchange Transactions")).not.toBeInTheDocument();
      expect(screen.queryByText("Confirmation")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
    });

    it("gives an Approver the transaction screens and nothing else", async () => {
      signInAs("APPROVER");
      renderWithQueryClient(<Sidebar />);

      expect(await screen.findByText("Confirmation")).toBeInTheDocument();
      expect(screen.getByText("Exchange Transactions")).toBeInTheDocument();

      expect(screen.queryByText("Needle Type")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
      expect(screen.queryByText("Stock Overview")).not.toBeInTheDocument();
    });

    it("keeps every built screen for Management", async () => {
      signInAs("MANAGEMENT");
      renderWithQueryClient(<Sidebar />);

      expect(await screen.findByText("Exchange Transactions")).toBeInTheDocument();
      expect(screen.getByText("Needle Type")).toBeInTheDocument();
      expect(screen.getByText("Audit Log")).toBeInTheDocument();
    });
  });

  describe("sections", () => {
    it("drops a section heading when every entry under it is hidden", async () => {
      signInAs("PIC_TROLI");
      renderWithQueryClient(<Sidebar />);

      await screen.findByText("Exchange Transactions");

      // PIC_TROLI holds no MASTER_VIEW, so the whole group goes with its items.
      expect(screen.queryByText("Master Data")).not.toBeInTheDocument();
      expect(screen.getByText("Transactions")).toBeInTheDocument();
    });

    it("gives PIC_INVENTORY real links to every built Inventory screen", async () => {
      signInAs("PIC_INVENTORY");
      renderWithQueryClient(<Sidebar />);

      // All five Inventory screens are built now — real links, not disabled spans.
      expect(await screen.findByText("Inventory")).toBeInTheDocument();
      for (const label of ["Stock Overview", "Stock Movement", "Receiving", "Transfer", "Adjustment"]) {
        const entry = screen.getByText(label);
        expect(entry.closest("a")).not.toBeNull();
        expect(entry.closest("[aria-disabled='true']")).toBeNull();
      }
    });
  });

  describe("unavailable entries", () => {
    it("renders an unbuilt entry as disabled rather than as a link", async () => {
      signInAs("SYSTEM_ADMIN");
      renderWithQueryClient(<Sidebar />);

      const analytics = await screen.findByText("Analytics");
      expect(analytics.closest("[aria-disabled='true']")).not.toBeNull();
      expect(analytics.closest("a")).toBeNull();
    });

    it("renders a built entry as a real link", async () => {
      signInAs("SYSTEM_ADMIN");
      renderWithQueryClient(<Sidebar />);

      const dashboard = await screen.findByText("Dashboard");
      expect(dashboard.closest("a")).toHaveAttribute("href", "/dashboard");
    });

    // `available` is a roadmap signal, so it must not vary by who is looking.
    it("disables an unbuilt entry the same way for a narrower role", async () => {
      signInAs("PIC_INVENTORY");
      renderWithQueryClient(<Sidebar />);

      // PIC_INVENTORY holds MASTER_VIEW, so this still-unbuilt Master Data
      // entry is visible to them too, and just as disabled as for anyone else.
      const storage = await screen.findByText("Storage / Needle Hole");
      expect(storage.closest("[aria-disabled='true']")).not.toBeNull();
    });
  });

  describe("session loading", () => {
    it("shows no menu entries until the session resolves", () => {
      useSessionBootstrapStore.setState({ ready: false });

      renderWithQueryClient(<Sidebar />);

      // Rendering the full menu first and removing entries once permissions
      // land would show every user things they cannot have, however briefly.
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
    });
  });

  describe("collapsed", () => {
    // Collapsed labels live in Radix tooltips, which the real app provides
    // through AppShell — supplied here so this test renders the same tree.
    it("offers the same entries collapsed as expanded", async () => {
      signInAs("PIC_TROLI");
      const user = userEvent.setup();
      renderWithQueryClient(
        <TooltipProvider>
          <Sidebar />
        </TooltipProvider>
      );

      await screen.findByText("Exchange Transactions");
      const expanded = screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
        .sort();

      await user.click(screen.getByLabelText("Collapse sidebar"));

      // Collapsing drops the visible labels, not the entries — the same set of
      // destinations must survive, or collapsing would change what is offered.
      const collapsed = screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
        .sort();

      expect(collapsed).toEqual(expanded);
      expect(collapsed).toContain("/transactions/exchange");
      expect(collapsed).not.toContain("/administration/audit");
    });
  });
});
