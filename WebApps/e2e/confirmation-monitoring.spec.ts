import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope } from "./helpers/auth";

function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "CNF-1",
    confirmationNumber: "CNF-20260810-000001",
    exchangeId: "EX-1",
    exchangeNumber: "EXC-20260810-000001",
    exchangeStatus: "CONFIRMATION_PENDING",
    factoryId: "FAC-001",
    status: "PENDING",
    requestedToUserId: "USR-001",
    requestedAt: "2026-08-10T08:31:00.000Z",
    dueAt: "2026-08-10T09:31:00.000Z",
    decidedAt: null,
    decisions: [],
    ...overrides,
  };
}

const USERS = [
  { id: "USR-001", username: "budi.santoso", name: "Budi Santoso", status: "ACTIVE", roles: ["APPROVER"], factoryIds: ["FAC-001"] },
];

async function mockConfirmationsApi(page: Page): Promise<{ params: URLSearchParams }[]> {
  const requests: { params: URLSearchParams }[] = [];

  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/auth/me" && route.request().method() === "GET") {
      return route.fulfill({ json: authMeEnvelope() });
    }
    if (path === "/users" && route.request().method() === "GET") {
      return route.fulfill({ json: envelope(USERS, { page: 1, pageSize: 100, total: USERS.length, totalPages: 1 }) });
    }
    if (path === "/confirmations" && route.request().method() === "GET") {
      requests.push({ params: url.searchParams });
      return route.fulfill({ json: envelope([makeItem()], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) });
    }
    if (path === "/confirmations/CNF-1" && route.request().method() === "GET") {
      return route.fulfill({ json: envelope(makeItem()) });
    }

    return route.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "unmocked", details: [] } } });
  });

  return requests;
}

test.describe("Confirmation Monitoring", () => {
  test("page loads with the Pending tab active and renders resolved rows", async ({ page }) => {
    const requests = await mockConfirmationsApi(page);

    await page.goto("/transactions/confirmation");

    await expect(page.getByRole("heading", { name: "Confirmation" })).toBeVisible();
    await expect(page.getByText("CNF-20260810-000001")).toBeVisible();
    expect(requests[0].params.get("status")).toBe("PENDING");
  });

  test("switching status tabs requests the new status and resets to page 1", async ({ page }) => {
    const requests = await mockConfirmationsApi(page);

    await page.goto("/transactions/confirmation");
    await expect(page.getByText("CNF-20260810-000001")).toBeVisible();

    await page.getByRole("tab", { name: "Approved" }).click();

    await expect.poll(() => requests.at(-1)?.params.get("status")).toBe("APPROVED");
    expect(requests.at(-1)?.params.get("page")).toBe("1");
  });

  test("clicking the Exchange link in a row navigates to Exchange Detail, not Confirmation Detail", async ({ page }) => {
    await mockConfirmationsApi(page);
    await page.route("**/api/v1/exchanges/EX-1", (route) =>
      route.fulfill({
        json: envelope({
          id: "EX-1",
          exchangeNumber: "EXC-20260810-000001",
          status: "CONFIRMATION_PENDING",
          factoryId: "FAC-001",
          trolleyId: "TRL-001",
          deviceId: "DEV-001",
          operatorId: null,
          exchangeTypeId: null,
          oldNeedleTypeId: null,
          newNeedleTypeId: null,
          fragmentStatus: "NOT_FOUND",
          confirmationId: "CNF-1",
          createdAt: "2026-08-10T08:30:00.000Z",
          completedAt: null,
          cancelledAt: null,
        }),
      })
    );
    await page.route("**/api/v1/exchanges/EX-1/evidence", (route) => route.fulfill({ json: envelope([]) }));
    await page.route("**/api/v1/audit-logs*", (route) => route.fulfill({ json: envelope([], { total: 0 }) }));

    await page.goto("/transactions/confirmation");
    await page.getByRole("link", { name: "EXC-20260810-000001", exact: true }).click();

    await expect(page).toHaveURL(/\/transactions\/exchange\/EX-1$/);
  });

  test("row click navigates to Confirmation Detail and renders it", async ({ page }) => {
    await mockConfirmationsApi(page);

    await page.goto("/transactions/confirmation");
    await page.getByText("CNF-20260810-000001").click();

    await expect(page).toHaveURL(/\/transactions\/confirmation\/CNF-1$/);
    await expect(page.getByRole("heading", { name: "CNF-20260810-000001" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  });

  test("renders exactly one Factory selector, in TopBar", async ({ page }) => {
    await mockConfirmationsApi(page);

    await page.goto("/transactions/confirmation");
    await expect(page.getByText("CNF-20260810-000001")).toBeVisible();

    await expect(page.getByText("All Factories")).toHaveCount(1);
  });

  test("resolves the Requested To column to a real name", async ({ page }) => {
    await mockConfirmationsApi(page);

    await page.goto("/transactions/confirmation");

    await expect(page.getByText("Budi Santoso")).toBeVisible();
  });
});
