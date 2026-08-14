import { test, expect, type Page, type Route } from "@playwright/test";
import { MOCK_SESSION_USER } from "./helpers/auth";

/**
 * Per-role navigation, asserted on a real rendered page.
 *
 * The permission lists are the seeded grants from
 * `Backend/src/shared/constants/roles.ts`, so these are the menus real users
 * get. Everything here is a UX guard — the backend refuses independently, and
 * these assertions only prove the app stops offering what it knows will be
 * refused.
 */
const ROLE_PERMISSIONS = {
  PIC_TROLI: [
    "DASHBOARD_VIEW",
    "EXCHANGE_VIEW",
    "EXCHANGE_CREATE",
    "EXCHANGE_ISSUE",
    "EXCHANGE_COMPLETE",
    "EXCHANGE_CANCEL",
    "CONFIRMATION_VIEW",
    "STOCK_VIEW",
  ],
  PIC_INVENTORY: [
    "DASHBOARD_VIEW",
    "STOCK_VIEW",
    "STOCK_RECEIVE",
    "STOCK_TRANSFER",
    "STOCK_RETURN",
    "STOCK_ADJUST",
    "STOCK_COUNT",
    "MASTER_VIEW",
  ],
  MANAGEMENT: [
    "DASHBOARD_VIEW",
    "EXCHANGE_VIEW",
    "CONFIRMATION_VIEW",
    "STOCK_VIEW",
    "MASTER_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "AUDIT_VIEW",
  ],
  APPROVER: [
    "DASHBOARD_VIEW",
    "EXCHANGE_VIEW",
    "CONFIRMATION_VIEW",
    "CONFIRMATION_APPROVE",
    "CONFIRMATION_REJECT",
  ],
} as const;

async function signInAs(page: Page, role: keyof typeof ROLE_PERMISSIONS) {
  await page.route("**/api/v1/auth/me", async (route: Route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { ...MOCK_SESSION_USER, roles: [role], permissions: ROLE_PERMISSIONS[role] },
        meta: { requestId: "REQ-TEST" },
      },
    });
  });

  // Master-data reads back the catalogue for factory names; irrelevant here,
  // but leaving it unmocked would let a real request escape the test.
  await page.route("**/api/v1/factories**", async (route: Route) => {
    await route.fulfill({
      json: { success: true, data: [], meta: { requestId: "REQ-TEST", page: 1, pageSize: 100, total: 0, totalPages: 0 } },
    });
  });
}

const sidebar = (page: Page) => page.getByRole("navigation");

test.describe("navigation visibility per role", () => {
  test("a PIC Troli is not offered Master Data or the Audit Log", async ({ page }) => {
    await signInAs(page, "PIC_TROLI");
    await page.goto("/dashboard");

    await expect(sidebar(page).getByText("Exchange Transactions")).toBeVisible();
    await expect(sidebar(page).getByText("Confirmation")).toBeVisible();

    // Six entries that would each have returned 403 on click.
    await expect(sidebar(page).getByText("Master Data")).toHaveCount(0);
    await expect(sidebar(page).getByText("Needle Type")).toHaveCount(0);
    await expect(sidebar(page).getByText("Audit Log")).toHaveCount(0);
  });

  test("a PIC Inventory is not offered the transaction screens", async ({ page }) => {
    await signInAs(page, "PIC_INVENTORY");
    await page.goto("/dashboard");

    await expect(sidebar(page).getByText("Needle Type")).toBeVisible();
    await expect(sidebar(page).getByText("Exchange Transactions")).toHaveCount(0);
    await expect(sidebar(page).getByText("Confirmation")).toHaveCount(0);
  });

  test("an Approver gets the transaction screens only", async ({ page }) => {
    await signInAs(page, "APPROVER");
    await page.goto("/dashboard");

    await expect(sidebar(page).getByText("Confirmation")).toBeVisible();
    await expect(sidebar(page).getByText("Needle Type")).toHaveCount(0);
    await expect(sidebar(page).getByText("Audit Log")).toHaveCount(0);
  });

  test("Management keeps every built screen", async ({ page }) => {
    await signInAs(page, "MANAGEMENT");
    await page.goto("/dashboard");

    await expect(sidebar(page).getByText("Exchange Transactions")).toBeVisible();
    await expect(sidebar(page).getByText("Needle Type")).toBeVisible();
    await expect(sidebar(page).getByText("Audit Log")).toBeVisible();
  });

  test("an unbuilt screen stays visible and disabled for a role that may use it", async ({
    page,
  }) => {
    await signInAs(page, "PIC_INVENTORY");
    await page.goto("/dashboard");

    // `available` is a roadmap signal, not a permission — it reads the same
    // for everyone who holds the grant.
    const stockOverview = sidebar(page).getByText("Stock Overview");
    await expect(stockOverview).toBeVisible();
    await expect(sidebar(page).locator("[aria-disabled='true']").first()).toBeVisible();
  });
});

test.describe("screen gating", () => {
  test("typing the URL of a screen you lack permission for is refused", async ({ page }) => {
    await signInAs(page, "PIC_TROLI");

    // Hiding the link is not securing the route — reaching it directly must
    // give the same answer.
    await page.goto("/administration/audit");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
  });

  test("a permitted user reaches the same screen", async ({ page }) => {
    await signInAs(page, "MANAGEMENT");
    await page.route("**/api/v1/audit-logs**", async (route: Route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [],
          meta: { requestId: "REQ-TEST", page: 1, pageSize: 20, total: 0, totalPages: 0 },
        },
      });
    });

    await page.goto("/administration/audit");

    await expect(page.getByText("You do not have access to this resource.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible();
  });
});
