import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, mockAuthMe } from "./helpers/auth";

function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

function makeDevice(overrides: Record<string, unknown> = {}) {
  return {
    id: "DEV-1",
    deviceCode: "DEV-001",
    deviceName: "Trolley A-01 Tablet",
    serialNumber: "SN-0001",
    factoryId: "FAC-001",
    trolleyId: "TRL-001",
    status: "ACTIVE",
    appVersion: "1.2.0",
    lastSeenAt: "2026-08-20T08:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const FACTORY = { id: "FAC-001", code: "FAC-001", name: "Bandung Plant", status: "ACTIVE", description: null, timezone: "Asia/Jakarta" };
const TROLLEY = { id: "TRL-001", code: "TRL-001", name: "Trolley 01", status: "ACTIVE", factoryId: "FAC-001", locationId: "LOC-001" };

interface Captured {
  method: string;
  path: string;
  params: URLSearchParams;
  body: unknown;
}

/** Every route this screen's own data source and its shared lookups can call, plus a catch-all that fails the test loudly for anything unmocked. */
async function mockDeviceApi(
  page: Page,
  opts: { forbidden?: boolean; heartbeatSpy?: string[] } = {},
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

    if (path === "/trolleys" && method === "GET") {
      return route.fulfill({ json: envelope([TROLLEY], { page: 1, pageSize: 100, total: 1, totalPages: 1 }) });
    }

    if (path === "/devices" && method === "GET") {
      requests.push({ path, method, params: url.searchParams, body: null });

      if (opts.forbidden) {
        return route.fulfill({
          status: 403,
          json: {
            success: false,
            error: { code: "FORBIDDEN", message: "Missing DEVICE_MANAGE", details: [] },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }

      return route.fulfill({ json: envelope([makeDevice()], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) });
    }

    if (path === "/devices" && method === "POST") {
      requests.push({ path, method, params: url.searchParams, body: route.request().postDataJSON() });
      return route.fulfill({ status: 201, json: envelope(makeDevice(route.request().postDataJSON() as Record<string, unknown>)) });
    }

    if (path === "/devices/DEV-1/activate" && method === "POST") {
      requests.push({ path, method, params: url.searchParams, body: route.request().postDataJSON() });
      return route.fulfill({ json: envelope(makeDevice({ status: "ACTIVE" })) });
    }

    if (path === "/devices/DEV-1/revoke" && method === "POST") {
      requests.push({ path, method, params: url.searchParams, body: route.request().postDataJSON() });
      return route.fulfill({ json: envelope(makeDevice({ status: "REVOKED" })) });
    }

    if (path === "/devices/DEV-1/reassign" && method === "POST") {
      requests.push({ path, method, params: url.searchParams, body: route.request().postDataJSON() });
      return route.fulfill({ json: envelope(makeDevice(route.request().postDataJSON() as Record<string, unknown>)) });
    }

    if (path === "/devices/DEV-1/heartbeat") {
      opts.heartbeatSpy?.push(method);
      return route.fulfill({ json: envelope(makeDevice()) });
    }

    return route.fulfill({
      status: 404,
      json: { success: false, error: { code: "NOT_FOUND", message: `unmocked: ${method} ${path}`, details: [] } },
    });
  });

  return requests;
}

test.describe("Devices", () => {
  test("page loads and renders resolved rows", async ({ page }) => {
    await mockDeviceApi(page);

    await page.goto("/administration/devices");

    await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();
    await expect(page.getByText("DEV-001")).toBeVisible();
    await expect(page.getByText("Trolley A-01 Tablet")).toBeVisible();
  });

  test("GET /devices is called with page=1, pageSize=20, and no other params on first load", async ({ page }) => {
    const requests = await mockDeviceApi(page);

    await page.goto("/administration/devices");
    await expect(page.getByText("DEV-001")).toBeVisible();

    const call = requests.find((r) => r.method === "GET");
    expect(call?.params.get("page")).toBe("1");
    expect(call?.params.get("pageSize")).toBe("20");
    expect(call?.params.has("factoryId")).toBe(false);
    expect(call?.params.has("trolleyId")).toBe(false);
    expect(call?.params.has("status")).toBe(false);
  });

  test("shows an access-denied message with no Retry on a 403 (DEVICE_MANAGE missing)", async ({ page }) => {
    await mockDeviceApi(page, { forbidden: true });

    await page.goto("/administration/devices");

    await expect(page.getByText("Missing DEVICE_MANAGE")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).not.toBeVisible();
  });

  test("an empty result set renders the EmptyState, not an error", async ({ page }) => {
    await mockAuthMe(page);
    await page.route("**/api/v1/devices*", (route) =>
      route.fulfill({ json: envelope([], { page: 1, pageSize: 20, total: 0, totalPages: 0 }) })
    );
    await page.route("**/api/v1/factories**", (route) => route.fulfill({ json: envelope([], { page: 1, pageSize: 100, total: 0, totalPages: 0 }) }));
    await page.route("**/api/v1/trolleys**", (route) => route.fulfill({ json: envelope([], { page: 1, pageSize: 100, total: 0, totalPages: 0 }) }));

    await page.goto("/administration/devices");

    await expect(page.getByText("No devices found.")).toBeVisible();
  });

  test("registering a device sends the form fields to POST /devices", async ({ page }) => {
    const requests = await mockDeviceApi(page);

    await page.goto("/administration/devices");
    await expect(page.getByText("DEV-001")).toBeVisible();

    await page.getByRole("button", { name: "Register Device" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Device ID *").fill("DEV-002");
    await dialog.getByLabel("Device Name *").fill("Trolley B-02 Tablet");
    await dialog.getByLabel("Serial Number *").fill("SN-0002");

    await dialog.getByRole("combobox", { name: "Factory" }).click();
    await page.getByRole("option", { name: "FAC-001", exact: false }).click();
    await dialog.getByRole("combobox", { name: "Trolley" }).click();
    await page.getByRole("option", { name: "TRL-001", exact: false }).click();

    await dialog.getByRole("button", { name: "Register Device" }).click();

    await expect.poll(() => requests.find((r) => r.method === "POST" && (r.body as { deviceCode?: string })?.deviceCode === "DEV-002")).toBeTruthy();
    const call = requests.find((r) => r.method === "POST" && (r.body as { deviceCode?: string })?.deviceCode === "DEV-002");
    expect(call?.body).toMatchObject({
      deviceCode: "DEV-002",
      deviceName: "Trolley B-02 Tablet",
      serialNumber: "SN-0002",
      factoryId: "FAC-001",
      trolleyId: "TRL-001",
    });
  });

  test("revoking a device calls POST /devices/:id/revoke after confirmation", async ({ page }) => {
    const requests = await mockDeviceApi(page);

    await page.goto("/administration/devices");
    await expect(page.getByText("DEV-001")).toBeVisible();
    const row = page.getByRole("row", { name: /DEV-001/ });
    await row.getByRole("button", { name: /Revoke/ }).click();

    await expect(page.getByRole("heading", { name: "Revoke Device" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm Revocation" }).click();

    await expect.poll(() => requests.some((r) => r.method === "POST" && r.path === "/devices/DEV-1/revoke")).toBe(true);
  });

  test("reassigning a device calls POST /devices/:id/reassign with the new factory/trolley pair", async ({ page }) => {
    const requests = await mockDeviceApi(page);

    await page.goto("/administration/devices");
    await expect(page.getByText("DEV-001")).toBeVisible();
    const row = page.getByRole("row", { name: /DEV-001/ });
    await row.getByRole("button", { name: /Reassign/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Reassign Device" })).toBeVisible();
    await dialog.getByRole("button", { name: "Confirm Reassignment" }).click();

    await expect.poll(() =>
      requests.some(
        (r) =>
          r.method === "POST" &&
          r.path === "/devices/DEV-1/reassign" &&
          (r.body as { factoryId?: string; trolleyId?: string } | null)?.factoryId === "FAC-001" &&
          (r.body as { factoryId?: string; trolleyId?: string } | null)?.trolleyId === "TRL-001",
      )
    ).toBe(true);
  });

  test("nothing in the Devices screen ever calls POST /devices/:id/heartbeat", async ({ page }) => {
    const heartbeatSpy: string[] = [];
    await mockDeviceApi(page, { heartbeatSpy });

    await page.goto("/administration/devices");
    await expect(page.getByText("DEV-001")).toBeVisible();

    const row = page.getByRole("row", { name: /DEV-001/ });
    await row.getByRole("button", { name: /Revoke/ }).click();
    await page.getByRole("button", { name: "Confirm Revocation" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    expect(heartbeatSpy).toHaveLength(0);
  });
});

test.describe("Devices — permission gating", () => {
  test("a caller without DEVICE_MANAGE never sends GET /devices and sees access-denied", async ({ page }) => {
    let called = false;
    await page.route("**/api/v1/auth/me", async (route: Route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: "USR-000",
            username: "operator",
            name: "Operator",
            roles: ["PIC_TROLI"],
            permissions: ["DASHBOARD_VIEW", "EXCHANGE_VIEW"],
            factoryIds: ["FAC-001"],
            locationIds: [],
          },
          meta: { requestId: "REQ-TEST" },
        },
      });
    });
    await page.route("**/api/v1/devices*", async () => {
      called = true;
    });

    await page.goto("/administration/devices");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(called).toBe(false);
  });
});
