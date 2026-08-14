import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, MOCK_SESSION_USER } from "./helpers/auth";

function unauthorized() {
  return {
    status: 401,
    json: { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized", details: [] }, meta: { requestId: "REQ-TEST" } },
  };
}

async function mockLoggedOut(page: Page): Promise<void> {
  await page.route("**/api/v1/auth/me", (route: Route) => route.fulfill(unauthorized()));
}

test.describe("Authentication", () => {
  test("visiting a protected route while logged out redirects to /login", async ({ page }) => {
    await mockLoggedOut(page);

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Needle Management")).toBeVisible();
  });

  test("logging in with valid credentials redirects to /dashboard and shows the real user", async ({ page }) => {
    await mockLoggedOut(page);
    await page.goto("/login");

    await page.route("**/api/v1/auth/login", (route: Route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresIn: 900,
            user: { id: MOCK_SESSION_USER.id, username: MOCK_SESSION_USER.username, name: MOCK_SESSION_USER.name, roles: MOCK_SESSION_USER.roles },
          },
          meta: { requestId: "REQ-TEST" },
        },
      })
    );
    // Once logged in, /auth/me should succeed instead of the logged-out 401 above.
    await page.route("**/api/v1/auth/me", (route: Route) => route.fulfill({ json: authMeEnvelope() }));
    await page.route("**/api/v1/dashboard/**", (route: Route) =>
      route.fulfill({ json: { success: true, data: {}, meta: { requestId: "REQ-TEST" } } })
    );

    await page.getByLabel(/Username/).fill("admin");
    await page.getByLabel(/Password/).fill("secret");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(MOCK_SESSION_USER.name)).toBeVisible();
  });

  test("logging in with invalid credentials shows the backend's real error and stays on /login", async ({ page }) => {
    await mockLoggedOut(page);
    await page.goto("/login");

    await page.route("**/api/v1/auth/login", (route: Route) =>
      route.fulfill({
        status: 401,
        json: { success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials or inactive user", details: [] }, meta: { requestId: "REQ-TEST" } },
      })
    );

    await page.getByLabel(/Username/).fill("admin");
    await page.getByLabel(/Password/).fill("wrong");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials or inactive user")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("visiting /login while already authenticated redirects straight to /dashboard", async ({ page }) => {
    await page.route("**/api/v1/auth/me", (route: Route) => route.fulfill({ json: authMeEnvelope() }));
    await page.route("**/api/v1/dashboard/**", (route: Route) =>
      route.fulfill({ json: { success: true, data: {}, meta: { requestId: "REQ-TEST" } } })
    );

    await page.goto("/login");

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("logout clears the session — the next protected-route visit redirects to /login", async ({ page }) => {
    await page.route("**/api/v1/auth/me", (route: Route) => route.fulfill({ json: authMeEnvelope() }));
    await page.route("**/api/v1/auth/logout", (route: Route) => route.fulfill({ status: 204 }));
    await page.route("**/api/v1/dashboard/**", (route: Route) =>
      route.fulfill({ json: { success: true, data: {}, meta: { requestId: "REQ-TEST" } } })
    );

    await page.goto("/dashboard");
    await expect(page.getByText(MOCK_SESSION_USER.name)).toBeVisible();

    // From here on, the session is gone — model that at the network layer too.
    await page.route("**/api/v1/auth/me", (route: Route) => route.fulfill(unauthorized()));

    await page.getByRole("button", { name: MOCK_SESSION_USER.name }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
