import { test, expect, type Page, type Route } from "@playwright/test";
import { mockAuthMe } from "./helpers/auth";

/**
 * `GET /exchanges` is real (Backend/src/modules/exchange) but there's no live
 * Backend in this environment, so every test intercepts the request at the
 * network layer and asserts on the query string Playwright actually
 * observed — this is what proves the frontend sends the right params, not a
 * guess about what it *should* send.
 */
function mockItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "EX-1",
    exchangeNumber: "EXC-20260810-000001",
    status: "COMPLETED",
    factoryId: "FAC-001",
    trolleyId: "TRL-001",
    deviceId: "DEV-001",
    operatorId: null,
    exchangeTypeId: null,
    oldNeedleTypeId: null,
    newNeedleTypeId: null,
    fragmentStatus: null,
    confirmationId: null,
    createdAt: "2026-08-10T08:30:00.000Z",
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

function envelope(items: unknown[], meta: Partial<Record<string, number>> = {}) {
  return {
    success: true,
    data: items,
    meta: { requestId: "REQ-TEST", page: 1, pageSize: 20, total: items.length, totalPages: 1, ...meta },
  };
}

interface CapturedRequest {
  params: URLSearchParams;
}

async function mockExchanges(page: Page, handler: (params: URLSearchParams) => object): Promise<CapturedRequest[]> {
  const requests: CapturedRequest[] = [];
  await page.route("**/exchanges*", async (route: Route) => {
    const url = new URL(route.request().url());
    requests.push({ params: url.searchParams });
    await route.fulfill({ json: handler(url.searchParams) });
  });
  return requests;
}

test.describe("Exchange Transactions", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
  });

  test("page loads and renders the resolved rows", async ({ page }) => {
    await mockExchanges(page, () => envelope([mockItem()]));

    await page.goto("/transactions/exchange");

    await expect(page.getByRole("heading", { name: "Exchange Transactions" })).toBeVisible();
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();
  });

  test("GET /exchanges is called with page=1, pageSize=20, and no factory/trolley/status params on first load", async ({
    page,
  }) => {
    const requests = await mockExchanges(page, () => envelope([mockItem()]));

    await page.goto("/transactions/exchange");
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();

    expect(requests).toHaveLength(1);
    const params = requests[0].params;
    expect(params.get("page")).toBe("1");
    expect(params.get("pageSize")).toBe("20");
    expect(params.has("factoryId")).toBe(false);
    expect(params.has("trolleyId")).toBe(false);
    expect(params.has("status")).toBe(false);
  });

  test("Factory filter (TopBar) changes the request", async ({ page }) => {
    const requests = await mockExchanges(page, () => envelope([mockItem()]));

    await page.goto("/transactions/exchange");
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();

    await page.getByRole("combobox").filter({ hasText: "All Factories" }).click();
    await page.getByRole("option", { name: "FAC-001", exact: true }).click();

    await expect.poll(() => requests.at(-1)?.params.get("factoryId")).toBe("FAC-001");
  });

  /**
   * The trolley filter is a select over the real trolley list, not free text.
   * It used to send whatever was typed to a `@IsUUID()` parameter, so any real
   * trolley code produced a 400 — which is why this asserts on the id the app
   * actually sends rather than on typed input.
   */
  test("Trolley filter sends the selected trolley's id", async ({ page }) => {
    const requests = await mockExchanges(page, () => envelope([mockItem()]));

    await page.route("**/api/v1/trolleys**", async (route: Route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: "TRL-002",
              code: "TRL-A-02",
              name: "Trolley A-02",
              status: "ACTIVE",
              factoryId: "FAC-001",
              locationId: "LOC-002",
            },
          ],
          meta: { requestId: "REQ-TEST", page: 1, pageSize: 100, total: 1, totalPages: 1 },
        },
      });
    });

    await page.goto("/transactions/exchange");
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Trolley" }).click();
    await page.getByRole("option", { name: /TRL-A-02/ }).click();

    await expect
      .poll(() => requests.at(-1)?.params.get("trolleyId"), { timeout: 2000 })
      .toBe("TRL-002");
  });

  test("Status filter changes the request", async ({ page }) => {
    const requests = await mockExchanges(page, () => envelope([mockItem()]));

    await page.goto("/transactions/exchange");
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Status" }).click();
    await page.getByRole("option", { name: "Completed" }).click();

    await expect.poll(() => requests.at(-1)?.params.get("status")).toBe("COMPLETED");
  });

  test("pagination changes the request and preserves the active filter", async ({ page }) => {
    const requests = await mockExchanges(page, (params) =>
      envelope([mockItem({ status: "CANCELLED" })], { page: Number(params.get("page") ?? 1), totalPages: 3, total: 50 })
    );

    await page.goto("/transactions/exchange");
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Status" }).click();
    await page.getByRole("option", { name: "Cancelled" }).click();
    await expect.poll(() => requests.at(-1)?.params.get("status")).toBe("CANCELLED");

    await page.getByRole("button", { name: "Next page" }).click();

    await expect
      .poll(() => requests.at(-1)?.params.get("page"))
      .toBe("2");
    expect(requests.at(-1)?.params.get("status")).toBe("CANCELLED");
  });

  test("renders exactly one Factory selector, in TopBar", async ({ page }) => {
    await mockExchanges(page, () => envelope([mockItem()]));

    await page.goto("/transactions/exchange");
    await expect(page.getByText("EXC-20260810-000001")).toBeVisible();

    await expect(page.getByText("All Factories")).toHaveCount(1);
  });

  test("an out-of-scope/zero-match factory renders an EmptyState, not an error — matches the real backend's scope-intersection behavior (factoryId either matches the caller's scope or the where-clause resolves to zero rows, never a 403)", async ({
    page,
  }) => {
    await mockExchanges(page, () => envelope([], { total: 0, totalPages: 0 }));

    await page.goto("/transactions/exchange");

    await expect(page.getByText("No exchange transactions found.")).toBeVisible();
    await expect(page.getByText(/Something went wrong/)).not.toBeVisible();
  });
});
