import type { Page, Route } from "@playwright/test";

/**
 * `RequireAuth` (features/auth) now wraps every protected route — any E2E
 * test that reaches one needs `GET /auth/me` mocked, or the page redirects
 * to `/login` before the screen under test ever renders. One fixture shared
 * across every spec file so "authenticated as who" stays consistent.
 */
export const MOCK_SESSION_USER = {
  id: "USR-000",
  username: "admin",
  name: "Test Admin",
  roles: ["SYSTEM_ADMIN"],
  permissions: [
    "DASHBOARD_VIEW",
    "EXCHANGE_VIEW",
    "EXCHANGE_CREATE",
    "EXCHANGE_ISSUE",
    "EXCHANGE_COMPLETE",
    "EXCHANGE_CANCEL",
    "CONFIRMATION_VIEW",
    "CONFIRMATION_APPROVE",
    "CONFIRMATION_REJECT",
    "AUDIT_VIEW",
  ],
  factoryIds: ["FAC-001", "FAC-002"],
  locationIds: [],
};

export function authMeEnvelope() {
  return { success: true, data: MOCK_SESSION_USER, meta: { requestId: "REQ-TEST" } };
}

/** For specs with no existing `**\/api/v1/**` catch-all (Dashboard, shell) — a narrow route that can't shadow anything else. */
export async function mockAuthMe(page: Page): Promise<void> {
  await page.route("**/api/v1/auth/me", async (route: Route) => {
    await route.fulfill({ json: authMeEnvelope() });
  });
}
