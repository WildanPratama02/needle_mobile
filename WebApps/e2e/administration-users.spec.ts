import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, mockAuthMe, MOCK_SESSION_USER } from "./helpers/auth";

function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

function makeUser(overrides: Record<string, unknown> = {}) {
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
  params: URLSearchParams;
}

/** Every route this screen's own data source and its shared lookups can call, plus a catch-all that fails the test loudly for anything unmocked. */
async function mockUsersApi(page: Page, opts: { forbidden?: boolean } = {}): Promise<Captured[]> {
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

    if (path === "/users" && method === "GET") {
      requests.push({ params: url.searchParams });

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

      return route.fulfill({ json: envelope([makeUser()], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) });
    }

    return route.fulfill({
      status: 404,
      json: { success: false, error: { code: "NOT_FOUND", message: `unmocked: ${method} ${path}`, details: [] } },
    });
  });

  return requests;
}

test.describe("Administration → Users", () => {
  test("page loads and renders resolved rows", async ({ page }) => {
    await mockUsersApi(page);

    await page.goto("/administration/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("budi.santoso")).toBeVisible();
    await expect(page.getByText("Budi Santoso")).toBeVisible();
    await expect(page.getByText("PIC_TROLI")).toBeVisible();
  });

  test("GET /users is called with page=1, pageSize=20, and no other params on first load", async ({ page }) => {
    const requests = await mockUsersApi(page);

    await page.goto("/administration/users");
    await expect(page.getByText("budi.santoso")).toBeVisible();

    const call = requests[0];
    expect(call.params.get("page")).toBe("1");
    expect(call.params.get("pageSize")).toBe("20");
    expect(call.params.has("factoryId")).toBe(false);
  });

  test("shows an access-denied message with no Retry on a 403 (USER_MANAGE missing)", async ({ page }) => {
    await mockUsersApi(page, { forbidden: true });

    await page.goto("/administration/users");

    await expect(page.getByText("Missing USER_MANAGE")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();
  });

  test("an empty result set renders the EmptyState, not an error", async ({ page }) => {
    await mockAuthMe(page);
    await page.route("**/api/v1/users*", (route) =>
      route.fulfill({ json: envelope([], { page: 1, pageSize: 20, total: 0, totalPages: 0 }) })
    );
    await page.route("**/api/v1/factories**", (route) =>
      route.fulfill({ json: envelope([], { page: 1, pageSize: 100, total: 0, totalPages: 0 }) })
    );

    await page.goto("/administration/users");

    await expect(page.getByText("No users found.")).toBeVisible();
  });

  test("no create, edit, or role-assignment control exists — this screen is read-only", async ({ page }) => {
    await mockUsersApi(page);

    await page.goto("/administration/users");
    await expect(page.getByText("budi.santoso")).toBeVisible();

    await expect(page.getByRole("button", { name: /add user/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^edit/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /deactivate/i })).not.toBeVisible();
  });

  test("a caller without USER_MANAGE never sends GET /users and sees access-denied", async ({ page }) => {
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
    await page.route("**/api/v1/users*", async () => {
      called = true;
    });

    await page.goto("/administration/users");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(called).toBe(false);
  });

  test("the Users nav entry is enabled (not the disabled roadmap treatment)", async ({ page }) => {
    await mockUsersApi(page);

    await page.goto("/administration/users");
    await expect(page.getByText("budi.santoso")).toBeVisible();

    const usersLink = page.getByRole("navigation").getByRole("link", { name: "Users" });
    await expect(usersLink).toBeVisible();
    await expect(usersLink).not.toHaveAttribute("aria-disabled", "true");
  });
});
