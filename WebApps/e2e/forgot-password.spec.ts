import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * `POST /auth/forgot-password` / `POST /auth/reset-password` aren't in
 * `Docs/12-OpenAPI-Swagger-Specification.md` yet — the backend counterpart
 * lands in parallel in the same worktree. Mocked at the network layer here,
 * same convention as the rest of this suite (`e2e/auth.spec.ts`), so this
 * spec doesn't block on that backend work landing first.
 */
async function mockLoggedOut(page: Page): Promise<void> {
  await page.route("**/api/v1/auth/me", (route: Route) =>
    route.fulfill({
      status: 401,
      json: { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized", details: [] }, meta: { requestId: "REQ-TEST" } },
    })
  );
}

test.describe("Forgot / reset password", () => {
  test("login page links to /forgot-password", async ({ page }) => {
    await mockLoggedOut(page);
    await page.goto("/login");

    await page.getByRole("link", { name: "Forgot password?" }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test("show/hide toggle works on the login password field", async ({ page }) => {
    await mockLoggedOut(page);
    await page.goto("/login");

    const passwordField = page.getByLabel(/^Password/);
    await passwordField.fill("secret123");
    await expect(passwordField).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordField).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(passwordField).toHaveAttribute("type", "password");
  });

  test("submitting a valid-looking email always shows the generic anti-enumeration message", async ({ page }) => {
    await page.route("**/api/v1/auth/forgot-password", (route: Route) =>
      route.fulfill({
        json: {
          success: true,
          data: { message: "If an account exists for that email, a reset link has been sent." },
          meta: { requestId: "REQ-TEST" },
        },
      })
    );

    await page.goto("/forgot-password");
    await page.getByLabel(/Email/).fill("someone@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("If an account exists for that email, a reset link has been sent.")).toBeVisible();
  });

  test("visiting /reset-password without a token shows the invalid-link state, not the form", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(page.getByText("This password reset link is invalid or has expired.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    await expect(page.getByLabel(/New password/)).toHaveCount(0);
  });

  test("visiting /reset-password with a token renders the set-new-password form, and both fields toggle independently", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=valid-token");

    const newPassword = page.getByLabel(/^New password/);
    const confirmPassword = page.getByLabel(/^Confirm new password/);
    // Each PasswordInput renders its toggle button as the input's sibling —
    // locating relative to the field itself keeps this unambiguous instead
    // of relying on DOM order across two otherwise-identical toggles.
    const newPasswordToggle = newPassword.locator("xpath=following-sibling::button");
    const confirmPasswordToggle = confirmPassword.locator("xpath=following-sibling::button");

    await expect(newPassword).toHaveAttribute("type", "password");
    await expect(confirmPassword).toHaveAttribute("type", "password");

    await newPasswordToggle.click();
    await expect(newPassword).toHaveAttribute("type", "text");
    await expect(confirmPassword).toHaveAttribute("type", "password");

    await confirmPasswordToggle.click();
    await expect(confirmPassword).toHaveAttribute("type", "text");

    await newPasswordToggle.click();
    await expect(newPassword).toHaveAttribute("type", "password");
    await expect(confirmPassword).toHaveAttribute("type", "text");
  });

  test("resetting with a valid token redirects to /login without auto-login", async ({ page }) => {
    await mockLoggedOut(page);
    await page.route("**/api/v1/auth/reset-password", (route: Route) =>
      route.fulfill({
        json: { success: true, data: { message: "Password reset." }, meta: { requestId: "REQ-TEST" } },
      })
    );

    await page.goto("/reset-password?token=valid-token");
    await page.getByLabel(/^New password/).fill("newpass1");
    await page.getByLabel(/^Confirm new password/).fill("newpass1");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("resetting with an invalid/expired token shows an inline error and a way back to /forgot-password", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/reset-password", (route: Route) =>
      route.fulfill({
        status: 400,
        json: {
          success: false,
          error: { code: "BAD_REQUEST", message: "This reset link is invalid or has expired.", details: [] },
          meta: { requestId: "REQ-TEST" },
        },
      })
    );

    await page.goto("/reset-password?token=expired-token");
    await page.getByLabel(/^New password/).fill("newpass1");
    await page.getByLabel(/^Confirm new password/).fill("newpass1");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    await expect(page).toHaveURL(/\/reset-password/);
  });

  test("client-side validation rejects a short password and a mismatched confirmation", async ({ page }) => {
    await page.goto("/reset-password?token=valid-token");

    await page.getByLabel(/^New password/).fill("short1");
    await page.getByLabel(/^Confirm new password/).fill("short1");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

    await page.getByLabel(/^New password/).fill("longenough1");
    await page.getByLabel(/^Confirm new password/).fill("longenough2");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });
});
