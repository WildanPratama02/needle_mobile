import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, mockAuthMe } from "./helpers/auth";

function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "AUD-1",
    timestamp: "2026-08-10T08:30:00.000Z",
    action: "CREATE_EXCHANGE",
    entityType: "Exchange",
    entityId: "EX-1",
    actorUserId: "USR-001",
    actorDeviceId: null,
    factoryId: "FAC-001",
    requestId: "REQ-1",
    beforeData: null,
    afterData: null,
    metadata: null,
    ...overrides,
  };
}

interface Captured {
  params: URLSearchParams;
}

async function mockAuditApi(page: Page, opts: { forbidden?: boolean } = {}): Promise<Captured[]> {
  const requests: Captured[] = [];

  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/auth/me" && route.request().method() === "GET") {
      return route.fulfill({ json: authMeEnvelope() });
    }
    if (path === "/audit-logs" && route.request().method() === "GET") {
      requests.push({ params: url.searchParams });

      if (opts.forbidden) {
        return route.fulfill({
          status: 403,
          json: {
            success: false,
            error: { code: "FORBIDDEN", message: "Missing AUDIT_VIEW", details: [] },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }

      return route.fulfill({ json: envelope([makeEntry()], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) });
    }

    return route.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "unmocked", details: [] } } });
  });

  return requests;
}

test.describe("Audit Log", () => {
  test("page loads and renders resolved rows, no mutating requests are ever sent", async ({ page }) => {
    await mockAuthMe(page);
    const seenMethods: string[] = [];
    await page.route("**/api/v1/audit-logs*", async (route: Route) => {
      seenMethods.push(route.request().method());
      await route.fulfill({ json: envelope([makeEntry()], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) });
    });

    await page.goto("/administration/audit");

    await expect(page.getByRole("heading", { name: "Audit Log" })).toBeVisible();
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();
    expect(seenMethods.every((m) => m === "GET")).toBe(true);
  });

  test("GET /audit-logs is called with page=1, pageSize=20, and no other params on first load", async ({ page }) => {
    const requests = await mockAuditApi(page);

    await page.goto("/administration/audit");
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();

    const params = requests[0].params;
    expect(params.get("page")).toBe("1");
    expect(params.get("pageSize")).toBe("20");
    expect(params.has("factoryId")).toBe(false);
    expect(params.has("actorUserId")).toBe(false);
    expect(params.has("entityType")).toBe(false);
    expect(params.has("entityId")).toBe(false);
    expect(params.has("action")).toBe(false);
    expect(params.has("dateFrom")).toBe(false);
    expect(params.has("dateTo")).toBe(false);
  });

  test("Action filter changes the request and resets to page 1", async ({ page }) => {
    const requests = await mockAuditApi(page);

    await page.goto("/administration/audit");
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Action" }).click();
    await page.getByRole("option", { name: "ISSUE NEEDLE" }).click();

    await expect.poll(() => requests.at(-1)?.params.get("action")).toBe("ISSUE_NEEDLE");
    expect(requests.at(-1)?.params.get("page")).toBe("1");
  });

  test("Entity Type filter changes the request (debounced)", async ({ page }) => {
    const requests = await mockAuditApi(page);

    await page.goto("/administration/audit");
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();

    await page.getByLabel("Entity Type").fill("Confirmation");

    await expect.poll(() => requests.at(-1)?.params.get("entityType"), { timeout: 2000 }).toBe("Confirmation");
  });

  test("pagination changes the request and preserves the active filter", async ({ page }) => {
    const requests = await mockAuditApi(page);
    // Override with a 3-page result so Next is enabled.
    await page.route("**/api/v1/audit-logs*", async (route: Route) => {
      const url = new URL(route.request().url());
      requests.push({ params: url.searchParams });
      await route.fulfill({ json: envelope([makeEntry()], { page: Number(url.searchParams.get("page") ?? 1), pageSize: 20, total: 50, totalPages: 3 }) });
    });

    await page.goto("/administration/audit");
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Action" }).click();
    await page.getByRole("option", { name: "CANCEL EXCHANGE" }).click();
    await expect.poll(() => requests.at(-1)?.params.get("action")).toBe("CANCEL_EXCHANGE");

    await page.getByRole("button", { name: "Next page" }).click();

    await expect.poll(() => requests.at(-1)?.params.get("page")).toBe("2");
    expect(requests.at(-1)?.params.get("action")).toBe("CANCEL_EXCHANGE");
  });

  test("Factory scope: TopBar's Factory selection is sent as the factoryId param", async ({ page }) => {
    const requests = await mockAuditApi(page);

    await page.goto("/administration/audit");
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();

    await page.getByRole("combobox").filter({ hasText: "All Factories" }).click();
    await page.getByRole("option", { name: "FAC-001", exact: true }).click();

    await expect.poll(() => requests.at(-1)?.params.get("factoryId")).toBe("FAC-001");
  });

  test("renders exactly one Factory selector, in TopBar", async ({ page }) => {
    await mockAuditApi(page);

    await page.goto("/administration/audit");
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();

    await expect(page.getByText("All Factories")).toHaveCount(1);
  });

  test("shows an access-denied message with no Retry on a 403 (AUDIT_VIEW missing)", async ({ page }) => {
    await mockAuditApi(page, { forbidden: true });

    await page.goto("/administration/audit");

    await expect(page.getByText("Missing AUDIT_VIEW")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();
  });

  test("an empty result set renders the EmptyState, not an error", async ({ page }) => {
    await mockAuthMe(page);
    await page.route("**/api/v1/audit-logs*", (route) =>
      route.fulfill({ json: envelope([], { page: 1, pageSize: 20, total: 0, totalPages: 0 }) })
    );

    await page.goto("/administration/audit");

    await expect(page.getByText("No audit records found.")).toBeVisible();
  });
});
