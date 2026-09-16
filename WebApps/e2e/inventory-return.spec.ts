import { test, expect, type Locator, type Page, type Route } from "@playwright/test";
import { MOCK_SESSION_USER } from "./helpers/auth";

/**
 * `/inventory/return`, history-first like Transfer, but Stock Return is
 * **trolley → warehouse only** (`.scratch/inventory-operation-history/spec.md`
 * decision 2) and its reason is mandatory — so the pickers that express that
 * rule, and the backend's own refusal when it is broken, are what these tests
 * are really about. Contract: spec.md "API contract", `Docs/12` §13.
 *
 * `MOCK_SESSION_USER` holds no `STOCK_*` grants (`sidebar.test.tsx` depends on
 * that list); each test grants what it needs through `GET /auth/me`.
 */

interface Captured {
  method: string;
  path: string;
  params: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

interface ReturnRow {
  id: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument: string | null;
  reason: string;
  outMovementNumber: string;
  inMovementNumber: string;
  createdBy: string;
  createdAt: string;
}

interface CreateReturnBody {
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument?: string;
  reason: string;
}

interface World {
  requests: Captured[];
  returns: ReturnRow[];
  balances: Record<string, number>;
}

function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

function pagedEnvelope<T>(items: T[]) {
  return envelope(items, { page: 1, pageSize: 20, total: items.length, totalPages: items.length === 0 ? 0 : 1 });
}

function collectionEnvelope<T>(items: T[]) {
  return envelope(items, { page: 1, pageSize: 100, total: items.length, totalPages: 1 });
}

function errorEnvelope(code: string, message: string) {
  return { success: false, error: { code, message, details: [] }, meta: { requestId: "REQ-TEST" } };
}

const FACTORY = {
  id: "FAC-001",
  code: "FAC-BDG",
  name: "Bandung Plant",
  status: "ACTIVE",
  description: null,
  timezone: "Asia/Jakarta",
};
const WAREHOUSE = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "WAREHOUSE",
  parentLocationId: null,
};
const TROLLEY = {
  id: "LOC-2",
  code: "TRL-A-01",
  name: "Trolley A-01",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "TROLLEY",
  parentLocationId: null,
};
/** A third type, so "only trolleys / only warehouses" is a real narrowing rather than a two-way split. */
const USED_NEEDLE_STORAGE = {
  id: "LOC-3",
  code: "UNS-01",
  name: "Used Needle Storage",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "USED_NEEDLE_STORAGE",
  parentLocationId: null,
};
const NEEDLE_TYPE = {
  id: "NT-1",
  code: "DBX1",
  name: "DBx1",
  status: "ACTIVE",
  category: null,
  unit: "pcs",
  minimumStock: 10,
  description: null,
};
const USERS = [
  { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: ["SYSTEM_ADMIN"], factoryIds: ["FAC-001"] },
];

const MOVEMENT = {
  id: "MOV-1",
  movementNumber: "MV-20260915-000005",
  movementType: "RETURN",
  factoryId: "FAC-001",
  sourceLocationId: "LOC-2",
  destinationLocationId: "LOC-1",
  needleTypeId: "NT-1",
  quantity: 10,
  referenceType: "RETURN",
  referenceId: "RET-1",
  reason: null,
  createdBy: "USR-000",
  createdAt: "2026-09-15T09:00:00.000Z",
};

function existingReturn(): ReturnRow {
  return {
    id: "RET-1",
    factoryId: "FAC-001",
    sourceLocationId: "LOC-2",
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 10,
    referenceDocument: "RT-00007",
    reason: "Excess stock after shift",
    outMovementNumber: "MV-20260915-000005",
    inMovementNumber: "MV-20260915-000006",
    createdBy: "USR-000",
    createdAt: "2026-09-15T09:00:00.000Z",
  };
}

function jsonBody(route: Route): unknown {
  try {
    return route.request().postDataJSON();
  } catch {
    return null;
  }
}

interface MockOptions {
  grants?: string[];
  createFailure?: { status: number; code: string; message: string };
}

/** Every route this screen and the ledger can reach, plus a catch-all that fails loudly for anything unmocked. */
async function mockReturnApi(page: Page, opts: MockOptions = {}): Promise<World> {
  const grants = opts.grants ?? ["STOCK_VIEW", "STOCK_RETURN"];
  const world: World = {
    requests: [],
    returns: [existingReturn()],
    balances: { "LOC-2:NT-1": 30, "LOC-1:NT-1": 5 },
  };

  await page.route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = request.method();

    world.requests.push({ method, path, params: url.searchParams, body: jsonBody(route), headers: request.headers() });

    if (path === "/auth/me" && method === "GET") {
      return route.fulfill({
        json: envelope({ ...MOCK_SESSION_USER, permissions: [...MOCK_SESSION_USER.permissions, ...grants] }),
      });
    }
    if (path === "/factories" && method === "GET") {
      return route.fulfill({ json: collectionEnvelope([FACTORY]) });
    }
    if (path === "/locations" && method === "GET") {
      const factoryId = url.searchParams.get("factoryId");
      const rows = [WAREHOUSE, TROLLEY, USED_NEEDLE_STORAGE].filter((row) => !factoryId || row.factoryId === factoryId);
      return route.fulfill({ json: collectionEnvelope(rows) });
    }
    if (path === "/needle-types" && method === "GET") {
      return route.fulfill({ json: collectionEnvelope([NEEDLE_TYPE]) });
    }
    if (path === "/users" && method === "GET") {
      return route.fulfill({ json: collectionEnvelope(USERS) });
    }

    if (path === "/inventory/balances" && method === "GET") {
      const locationId = url.searchParams.get("locationId") ?? "";
      const needleTypeId = url.searchParams.get("needleTypeId") ?? "";
      const quantity = world.balances[`${locationId}:${needleTypeId}`] ?? 0;
      return route.fulfill({
        json: envelope([{ locationId, needleTypeId, quantity, reservedQuantity: 0, availableQuantity: quantity }], {
          page: 1,
          pageSize: 1,
          total: 1,
          totalPages: 1,
        }),
      });
    }

    if (path === "/inventory/movements" && method === "GET") {
      return route.fulfill({ json: pagedEnvelope([MOVEMENT]) });
    }

    if (path === "/inventory/returns" && method === "GET") {
      return route.fulfill({ json: pagedEnvelope(world.returns) });
    }

    if (path === "/inventory/returns" && method === "POST") {
      if (opts.createFailure) {
        return route.fulfill({
          status: opts.createFailure.status,
          json: errorEnvelope(opts.createFailure.code, opts.createFailure.message),
        });
      }

      const body = request.postDataJSON() as CreateReturnBody;
      const created: ReturnRow = {
        id: "RET-2",
        factoryId: body.factoryId,
        sourceLocationId: body.sourceLocationId,
        destinationLocationId: body.destinationLocationId,
        needleTypeId: body.needleTypeId,
        quantity: body.quantity,
        referenceDocument: body.referenceDocument ?? null,
        reason: body.reason,
        outMovementNumber: "MV-20260916-000012",
        inMovementNumber: "MV-20260916-000013",
        createdBy: "USR-000",
        createdAt: "2026-09-16T02:00:00.000Z",
      };

      const sourceKey = `${body.sourceLocationId}:${body.needleTypeId}`;
      const destinationKey = `${body.destinationLocationId}:${body.needleTypeId}`;
      world.balances[sourceKey] = (world.balances[sourceKey] ?? 0) - body.quantity;
      world.balances[destinationKey] = (world.balances[destinationKey] ?? 0) + body.quantity;
      world.returns.unshift(created);

      return route.fulfill({
        status: 201,
        json: envelope({
          returnId: created.id,
          outMovementNumber: created.outMovementNumber,
          inMovementNumber: created.inMovementNumber,
          factoryId: created.factoryId,
          sourceLocationId: created.sourceLocationId,
          destinationLocationId: created.destinationLocationId,
          needleTypeId: created.needleTypeId,
          quantity: created.quantity,
          referenceDocument: created.referenceDocument,
          reason: created.reason,
          sourceBalanceQuantity: world.balances[sourceKey],
          destinationBalanceQuantity: world.balances[destinationKey],
          createdAt: created.createdAt,
        }),
      });
    }

    if (path.startsWith("/inventory/returns/") && method === "GET") {
      const id = path.replace("/inventory/returns/", "");
      const row = world.returns.find((item) => item.id === id);
      if (!row) {
        return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `Return not found: ${id}`) });
      }
      return route.fulfill({ json: envelope(row) });
    }

    return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `unmocked: ${method} ${path}`) });
  });

  return world;
}

function historyRow(page: Page, outMovementNumber: string): Locator {
  return page.getByRole("button", { name: `View return ${outMovementNumber}` });
}

function impact(dialog: Locator, label: string): Locator {
  return dialog.locator("dl > div").filter({ hasText: label }).locator("dd");
}

function listCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "GET" && request.path === "/inventory/returns");
}

function createCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "POST" && request.path === "/inventory/returns");
}

async function openNewReturn(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "New Return" }).click();
  const dialog = page.getByRole("dialog", { name: "New Stock Return" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillReturnForm(page: Page, dialog: Locator, opts: { quantity?: string } = {}): Promise<void> {
  await dialog.getByRole("combobox", { name: "Factory" }).click();
  await page.getByRole("option", { name: /Bandung Plant/ }).click();

  await dialog.getByRole("combobox", { name: "Source Location" }).click();
  await page.getByRole("option", { name: /Trolley A-01/ }).click();

  await dialog.getByRole("combobox", { name: "Destination Location" }).click();
  await page.getByRole("option", { name: /Main Warehouse/ }).click();

  await dialog.getByRole("combobox", { name: "Needle Type" }).click();
  await page.getByRole("option", { name: /DBx1/ }).click();

  await dialog.getByLabel("Quantity *", { exact: true }).fill(opts.quantity ?? "10");
}

test.describe("Inventory → Stock Return: history", () => {
  test("lists each return with its reason rather than a note, and says which way stock moves", async ({ page }) => {
    await mockReturnApi(page);

    await page.goto("/inventory/return");

    await expect(page.getByRole("heading", { name: "Stock Return" })).toBeVisible();
    await expect(page.getByText(/trolley to a warehouse/)).toBeVisible();

    const row = historyRow(page, "MV-20260915-000005");
    await expect(row).toBeVisible();
    await expect(row).toContainText("MV-20260915-000006");
    await expect(row).toContainText("TRL-A-01 — Trolley A-01");
    await expect(row).toContainText("WH-01 — Main Warehouse");
    await expect(row).toContainText("RT-00007");
    await expect(row).toContainText("Excess stock after shift");
    await expect(row).toContainText("Test Admin");
    await expect(page.getByRole("columnheader", { name: "Reason" })).toBeVisible();
  });

  test("asks for page 1 of 20, unfiltered, on first load", async ({ page }) => {
    const world = await mockReturnApi(page);

    await page.goto("/inventory/return");
    await expect(historyRow(page, "MV-20260915-000005")).toBeVisible();

    const call = listCalls(world)[0];
    expect(call.params.get("page")).toBe("1");
    expect(call.params.get("pageSize")).toBe("20");
    expect(call.params.has("factoryId")).toBe(false);
  });

  test("a row opens that return's own detail, linkable by `?id=`", async ({ page }) => {
    const world = await mockReturnApi(page);

    await page.goto("/inventory/return");
    await historyRow(page, "MV-20260915-000005").click();

    const detail = page.getByRole("dialog", { name: "Stock Return Detail" });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("MV-20260915-000005 (out) · MV-20260915-000006 (in)");
    await expect(detail).toContainText("Excess stock after shift");
    await expect(detail).toContainText("RT-00007");
    await expect(page).toHaveURL(/\/inventory\/return\?id=RET-1$/);
    expect(world.requests.some((request) => request.path === "/inventory/returns/RET-1")).toBe(true);
  });

  test("the ledger's Reference drills through to the return that owns the movement", async ({ page }) => {
    await mockReturnApi(page);

    await page.goto("/inventory/movement");
    const reference = page.getByRole("table").getByRole("link", { name: "Stock Return" });
    await expect(reference).toHaveAttribute("href", "/inventory/return?id=RET-1");

    await reference.click();
    await page.waitForURL(/\/inventory\/return\?id=RET-1$/);

    await expect(page.getByRole("dialog", { name: "Stock Return Detail" })).toContainText("MV-20260915-000005");
  });
});

test.describe("Inventory → Stock Return: create", () => {
  test("offers only trolley sources and only warehouse destinations", async ({ page }) => {
    await mockReturnApi(page);

    await page.goto("/inventory/return");
    await expect(historyRow(page, "MV-20260915-000005")).toBeVisible();
    const dialog = await openNewReturn(page);

    await expect(dialog.getByText("Source Trolley *")).toBeVisible();
    await expect(dialog.getByText("Destination Warehouse *")).toBeVisible();

    await dialog.getByRole("combobox", { name: "Factory" }).click();
    await page.getByRole("option", { name: /Bandung Plant/ }).click();

    await dialog.getByRole("combobox", { name: "Source Location" }).click();
    await expect(page.getByRole("option", { name: /Trolley A-01/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Main Warehouse/ })).toHaveCount(0);
    await expect(page.getByRole("option", { name: /Used Needle Storage/ })).toHaveCount(0);
    await page.keyboard.press("Escape");

    await dialog.getByRole("combobox", { name: "Destination Location" }).click();
    await expect(page.getByRole("option", { name: /Main Warehouse/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Trolley A-01/ })).toHaveCount(0);
    await expect(page.getByRole("option", { name: /Used Needle Storage/ })).toHaveCount(0);
  });

  test("refuses to submit without a reason", async ({ page }) => {
    const world = await mockReturnApi(page);

    await page.goto("/inventory/return");
    await expect(historyRow(page, "MV-20260915-000005")).toBeVisible();
    const dialog = await openNewReturn(page);
    await fillReturnForm(page, dialog);

    await dialog.getByRole("button", { name: "Review Return" }).click();

    await expect(dialog.getByText("Reason is required")).toBeVisible();
    expect(createCalls(world)).toHaveLength(0);
  });

  test("shows the trolley-to-warehouse impact, submits the exact payload, and the return joins the history without a reload", async ({
    page,
  }) => {
    const world = await mockReturnApi(page);

    await page.goto("/inventory/return");
    await expect(historyRow(page, "MV-20260915-000005")).toBeVisible();
    const listCallsBefore = listCalls(world).length;

    const dialog = await openNewReturn(page);
    await fillReturnForm(page, dialog);
    await dialog.getByLabel("Reference Document").fill("RT-9");
    await dialog.getByLabel("Reason *", { exact: true }).fill("Excess stock");
    await dialog.getByRole("button", { name: "Review Return" }).click();

    const confirm = page.getByRole("dialog", { name: "Confirm Return" });
    await expect(impact(confirm, "Source Current")).toHaveText("30");
    await expect(impact(confirm, "Source After")).toHaveText("20");
    await expect(impact(confirm, "Destination Current")).toHaveText("5");
    await expect(impact(confirm, "Destination After")).toHaveText("15");
    await expect(impact(confirm, "Reason")).toHaveText("Excess stock");
    await confirm.getByRole("button", { name: "Confirm Return" }).click();

    await expect(page.getByText("Return recorded. Both balances updated.")).toBeVisible();
    await expect(page.getByText("Return stock from a trolley back to a warehouse.")).toHaveCount(0);

    const call = createCalls(world)[0];
    expect(call.body).toEqual({
      factoryId: "FAC-001",
      sourceLocationId: "LOC-2",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 10,
      referenceDocument: "RT-9",
      reason: "Excess stock",
    });
    expect(call.headers["idempotency-key"]).toBeTruthy();

    await expect(historyRow(page, "MV-20260916-000012")).toBeVisible();
    expect(listCalls(world).length).toBeGreaterThan(listCallsBefore);
  });

  test("surfaces the backend's trolley-to-warehouse refusal inline — the server, not the picker, is the authority", async ({
    page,
  }) => {
    await mockReturnApi(page, {
      createFailure: {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "A return must go from a TROLLEY location to a WAREHOUSE location",
      },
    });

    await page.goto("/inventory/return");
    await expect(historyRow(page, "MV-20260915-000005")).toBeVisible();
    const dialog = await openNewReturn(page);
    await fillReturnForm(page, dialog);
    await dialog.getByLabel("Reason *", { exact: true }).fill("Excess stock");
    await dialog.getByRole("button", { name: "Review Return" }).click();
    await page.getByRole("dialog", { name: "Confirm Return" }).getByRole("button", { name: "Confirm Return" }).click();

    await expect(page.getByRole("alert")).toContainText("must go from a TROLLEY location to a WAREHOUSE location");
    // The form dialog stays open behind the inline error, so Radix marks the
    // history `aria-hidden` — this asserts on the DOM rather than the
    // accessibility tree, which would report 0 rows either way.
    await expect(page.locator('[aria-label^="View return "]')).toHaveCount(1);
  });
});

test.describe("Inventory → Stock Return: permission gate", () => {
  test("a caller who may read the history but not return stock is offered no New Return", async ({ page }) => {
    await mockReturnApi(page, { grants: ["STOCK_VIEW"] });

    await page.goto("/inventory/return");

    await expect(historyRow(page, "MV-20260915-000005")).toBeVisible();
    await expect(page.getByRole("button", { name: "New Return" })).toHaveCount(0);
  });

  test("a caller without STOCK_VIEW sees access-denied, and the history is never requested", async ({ page }) => {
    const world = await mockReturnApi(page, { grants: ["STOCK_RETURN"] });

    await page.goto("/inventory/return");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(listCalls(world)).toHaveLength(0);
  });
});
