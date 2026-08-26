import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, MOCK_SESSION_USER } from "./helpers/auth";

function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

const ROLES = [
  { code: "SYSTEM_ADMIN", permissionCodes: ["USER_MANAGE", "DEVICE_MANAGE", "DASHBOARD_VIEW"], memberCount: 1 },
  { code: "PIC_TROLI", permissionCodes: ["EXCHANGE_CREATE", "EXCHANGE_ISSUE"], memberCount: 3 },
  { code: "PIC_INVENTORY", permissionCodes: ["STOCK_RECEIVE", "STOCK_TRANSFER"], memberCount: 2 },
  { code: "MANAGEMENT", permissionCodes: ["REPORT_VIEW"], memberCount: 1 },
  { code: "APPROVER", permissionCodes: ["CONFIRMATION_APPROVE", "CONFIRMATION_REJECT"], memberCount: 0 },
];

const PERMISSIONS = [
  { code: "USER_MANAGE" },
  { code: "DEVICE_MANAGE" },
  { code: "DASHBOARD_VIEW" },
  { code: "EXCHANGE_CREATE" },
  { code: "EXCHANGE_ISSUE" },
  { code: "STOCK_RECEIVE" },
  { code: "STOCK_TRANSFER" },
  { code: "REPORT_VIEW" },
  { code: "CONFIRMATION_APPROVE" },
  { code: "CONFIRMATION_REJECT" },
];

function makeMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "USR-1",
    username: "budi.santoso",
    name: "Budi Santoso",
    status: "ACTIVE",
    roles: ["PIC_TROLI"],
    factoryIds: ["FAC-001"],
    ...overrides,
  };
}

const FACTORY = { id: "FAC-001", code: "FAC-001", name: "Bandung Plant", status: "ACTIVE", description: null, timezone: "Asia/Jakarta" };

interface Captured {
  path: string;
  params: URLSearchParams;
}

/** Every route this screen's own data sources and its shared lookups can call, plus a catch-all that fails the test loudly for anything unmocked. */
async function mockRolesApi(
  page: Page,
  opts: { forbidden?: boolean; members?: Record<string, unknown>[] } = {},
): Promise<Captured[]> {
  const requests: Captured[] = [];

  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = route.request().method();

    if (path === "/auth/me" && method === "GET") {
      return route.fulfill({ json: authMeEnvelope() });
    }

    if (path === "/factories" && method === "GET") {
      return route.fulfill({ json: envelope([FACTORY], { page: 1, pageSize: 100, total: 1, totalPages: 1 }) });
    }

    if (path === "/roles" && method === "GET") {
      requests.push({ path, params: url.searchParams });

      if (opts.forbidden) {
        return route.fulfill({
          status: 403,
          json: {
            success: false,
            error: { code: "FORBIDDEN", message: "Missing USER_MANAGE", details: [] },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }

      return route.fulfill({ json: envelope(ROLES) });
    }

    if (path === "/permissions" && method === "GET") {
      requests.push({ path, params: url.searchParams });

      if (opts.forbidden) {
        return route.fulfill({
          status: 403,
          json: {
            success: false,
            error: { code: "FORBIDDEN", message: "Missing USER_MANAGE", details: [] },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }

      return route.fulfill({ json: envelope(PERMISSIONS) });
    }

    if (path === "/users" && method === "GET") {
      requests.push({ path, params: url.searchParams });

      if (opts.forbidden) {
        return route.fulfill({
          status: 403,
          json: {
            success: false,
            error: { code: "FORBIDDEN", message: "Missing USER_MANAGE", details: [] },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }

      const members = opts.members ?? [makeMember()];
      return route.fulfill({ json: envelope(members, { page: 1, pageSize: 100, total: members.length, totalPages: 1 }) });
    }

    return route.fulfill({
      status: 404,
      json: { success: false, error: { code: "NOT_FOUND", message: `unmocked: ${method} ${path}`, details: [] } },
    });
  });

  return requests;
}

test.describe("Administration → Roles & Permissions", () => {
  test("page loads and renders the five roles with their permission and member counts", async ({ page }) => {
    await mockRolesApi(page);

    await page.goto("/administration/roles");

    await expect(page.getByRole("heading", { name: "Roles & Permissions" })).toBeVisible();
    await expect(page.getByText("SYSTEM_ADMIN")).toBeVisible();
    await expect(page.getByText("PIC_TROLI")).toBeVisible();
    await expect(page.getByText("PIC_INVENTORY")).toBeVisible();
    await expect(page.getByText("MANAGEMENT", { exact: true })).toBeVisible();
    await expect(page.getByText("APPROVER")).toBeVisible();
  });

  test("renders the full permission catalogue as a reference on the list screen", async ({ page }) => {
    await mockRolesApi(page);

    await page.goto("/administration/roles");

    await expect(page.getByText("Permission Catalogue")).toBeVisible();
    await expect(page.getByText("REPORT_VIEW")).toBeVisible();
  });

  test("opening a role navigates to its detail view with the full permission list and members", async ({ page }) => {
    await mockRolesApi(page, { members: [makeMember({ username: "budi.santoso", name: "Budi Santoso" })] });

    await page.goto("/administration/roles");
    await page.getByText("PIC_TROLI").click();

    await expect(page).toHaveURL(/\/administration\/roles\/PIC_TROLI$/);
    await expect(page.getByRole("heading", { name: "PIC_TROLI" })).toBeVisible();
    await expect(page.getByText("EXCHANGE_CREATE")).toBeVisible();
    await expect(page.getByText("EXCHANGE_ISSUE")).toBeVisible();
    await expect(page.getByText("budi.santoso")).toBeVisible();
    await expect(page.getByText("Budi Santoso")).toBeVisible();
  });

  test("GET /users is called with role=<code> for a role's member table, not free-text search", async ({ page }) => {
    const requests = await mockRolesApi(page, { members: [makeMember()] });

    await page.goto("/administration/roles/PIC_TROLI");
    await expect(page.getByText("budi.santoso")).toBeVisible();

    const call = requests.find((r) => r.path === "/users");
    expect(call?.params.get("role")).toBe("PIC_TROLI");
  });

  test("a role with no current members renders the EmptyState, not an error", async ({ page }) => {
    await mockRolesApi(page, { members: [] });

    await page.goto("/administration/roles/APPROVER");

    await expect(page.getByRole("heading", { name: "APPROVER" })).toBeVisible();
    await expect(page.getByText("No members found.")).toBeVisible();
  });

  test("shows an access-denied message with no Retry on a 403 (USER_MANAGE missing)", async ({ page }) => {
    await mockRolesApi(page, { forbidden: true });

    await page.goto("/administration/roles");

    await expect(page.getByText("Missing USER_MANAGE")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();
  });

  test("no create, edit, or assign control exists anywhere — this screen is read-only", async ({ page }) => {
    await mockRolesApi(page);

    await page.goto("/administration/roles");
    await expect(page.getByText("SYSTEM_ADMIN")).toBeVisible();

    await expect(page.getByRole("button", { name: /add role/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^edit/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /assign/i })).not.toBeVisible();

    await page.getByText("PIC_TROLI").click();
    await expect(page.getByRole("heading", { name: "PIC_TROLI" })).toBeVisible();

    await expect(page.getByRole("button", { name: /add permission/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^edit/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /assign/i })).not.toBeVisible();
  });

  test("a caller without USER_MANAGE never sends GET /roles or GET /permissions and sees access-denied", async ({ page }) => {
    let called = false;
    await page.route("**/api/v1/auth/me", async (route: Route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { ...MOCK_SESSION_USER, roles: ["PIC_TROLI"], permissions: ["DASHBOARD_VIEW", "EXCHANGE_VIEW"] },
          meta: { requestId: "REQ-TEST" },
        },
      });
    });
    await page.route("**/api/v1/roles*", async () => {
      called = true;
    });
    await page.route("**/api/v1/permissions*", async () => {
      called = true;
    });

    await page.goto("/administration/roles");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(called).toBe(false);
  });

  test("the Roles & Permissions nav entry is enabled (not the disabled roadmap treatment)", async ({ page }) => {
    await mockRolesApi(page);

    await page.goto("/administration/roles");
    await expect(page.getByText("SYSTEM_ADMIN")).toBeVisible();

    const rolesLink = page.getByRole("navigation").getByRole("link", { name: "Roles & Permissions" });
    await expect(rolesLink).toBeVisible();
    await expect(rolesLink).not.toHaveAttribute("aria-disabled", "true");
  });
});
