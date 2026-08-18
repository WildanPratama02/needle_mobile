import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, MOCK_SESSION_USER } from "./helpers/auth";

/**
 * `.scratch/users-read-api/spec.md` (GAP-06). `GET /users` is real
 * (`Backend/src/modules/identity`'s `UserController`) but there's no live
 * Backend in this environment, so every test intercepts at the network layer.
 *
 * `MOCK_SESSION_USER` doesn't hold `USER_MANAGE` — most specs authenticate as
 * that session on purpose, to prove the rest of the app degrades gracefully
 * without it. Tests here that need the grant build their own `/auth/me` mock.
 */
function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

const USER = {
  id: "USR-001",
  username: "budi.santoso",
  name: "Budi Santoso",
  status: "ACTIVE",
  roles: ["SYSTEM_ADMIN"],
  factoryIds: ["FAC-001"],
};

const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE",
  description: null,
  timezone: "Asia/Jakarta",
};

async function mockUsersApi(page: Page, opts: { withUserManage?: boolean } = {}) {
  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = route.request().method();

    if (path === "/auth/me" && method === "GET") {
      if (opts.withUserManage) {
        return route.fulfill({
          json: {
            success: true,
            data: { ...MOCK_SESSION_USER, permissions: [...MOCK_SESSION_USER.permissions, "USER_MANAGE"] },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }
      return route.fulfill({ json: authMeEnvelope() });
    }
    if (path === "/users" && method === "GET") {
      return route.fulfill({ json: envelope([USER], { page: 1, pageSize: 100, total: 1, totalPages: 1 }) });
    }
    if (path === "/factories" && method === "GET") {
      return route.fulfill({ json: envelope([FACTORY], { page: 1, pageSize: 100, total: 1, totalPages: 1 }) });
    }

    return route.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "unmocked route", details: [] } } });
  });
}

test.describe("Administration → Users", () => {
  test("a caller holding USER_MANAGE sees the directory with resolved factory names", async ({ page }) => {
    await mockUsersApi(page, { withUserManage: true });

    await page.goto("/administration/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("budi.santoso")).toBeVisible();
    await expect(page.getByText("Budi Santoso")).toBeVisible();
    await expect(page.getByText("SYSTEM_ADMIN")).toBeVisible();
    await expect(page.getByText("Bandung Plant")).toBeVisible();
  });

  test("the Users nav entry is offered to a caller holding USER_MANAGE", async ({ page }) => {
    await mockUsersApi(page, { withUserManage: true });

    await page.goto("/dashboard");

    await expect(page.getByRole("navigation").getByText("Users")).toBeVisible();
    await page.getByRole("navigation").getByText("Users").click();

    await expect(page).toHaveURL(/\/administration\/users$/);
  });

  test("a caller without USER_MANAGE is refused and never requests the directory", async ({ page }) => {
    let usersRequested = false;
    await mockUsersApi(page, { withUserManage: false });
    page.on("request", (req) => {
      if (new URL(req.url()).pathname.replace(/^\/api\/v1/, "") === "/users") {
        usersRequested = true;
      }
    });

    await page.goto("/administration/users");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(usersRequested).toBe(false);
  });

  test("the Users nav entry is not offered to a caller without USER_MANAGE", async ({ page }) => {
    await mockUsersApi(page, { withUserManage: false });

    await page.goto("/dashboard");

    await expect(page.getByRole("navigation").getByText("Users")).toHaveCount(0);
  });
});
