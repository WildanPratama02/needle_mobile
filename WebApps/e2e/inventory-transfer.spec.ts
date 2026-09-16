import { test, expect, type Locator, type Page, type Route } from "@playwright/test";
import { MOCK_SESSION_USER } from "./helpers/auth";

/**
 * `/inventory/transfer`, history-first (`.scratch/inventory-operation-history/spec.md`
 * decision 1), driven against mocked `/api/v1` routes — there is no live
 * Backend in this environment, so the mock *is* the contract
 * (spec.md "API contract", `Docs/12` §13).
 *
 * These assert business behaviour rather than rendering: a created transfer
 * joins the history without a reload, the confirm step's before/after impact
 * is computed from the server's own balance read, the submitted payload is
 * exact and carries an Idempotency-Key, and the ledger's Reference column
 * drills through to the record that owns the movement.
 *
 * `MOCK_SESSION_USER` deliberately holds no `STOCK_*` grants (`sidebar.test.tsx`
 * depends on that list), so every test states the grants it needs by
 * fulfilling `GET /auth/me` with an extended permission list.
 */

interface Captured {
  method: string;
  path: string;
  params: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

interface TransferRow {
  id: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument: string | null;
  note: string | null;
  outMovementNumber: string;
  inMovementNumber: string;
  createdBy: string;
  createdAt: string;
}

interface CreateTransferBody {
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument?: string;
  note?: string;
}

interface World {
  requests: Captured[];
  transfers: TransferRow[];
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

/** One TRANSFER_OUT movement in the ledger, pointing at the transfer header it belongs to. */
const MOVEMENT = {
  id: "MOV-1",
  movementNumber: "MV-20260915-000001",
  movementType: "TRANSFER_OUT",
  factoryId: "FAC-001",
  sourceLocationId: "LOC-1",
  destinationLocationId: "LOC-2",
  needleTypeId: "NT-1",
  quantity: 20,
  referenceType: "TRANSFER",
  referenceId: "TRF-1",
  reason: null,
  createdBy: "USR-000",
  createdAt: "2026-09-15T08:00:00.000Z",
};

function existingTransfer(): TransferRow {
  return {
    id: "TRF-1",
    factoryId: "FAC-001",
    sourceLocationId: "LOC-1",
    destinationLocationId: "LOC-2",
    needleTypeId: "NT-1",
    quantity: 20,
    referenceDocument: "DO-0012",
    note: "Replenishment trolley",
    outMovementNumber: "MV-20260915-000001",
    inMovementNumber: "MV-20260915-000002",
    createdBy: "USR-000",
    createdAt: "2026-09-15T08:00:00.000Z",
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
  /** Added on top of `MOCK_SESSION_USER`'s own grants. */
  grants?: string[];
  createFailure?: { status: number; code: string; message: string };
}

/**
 * Every route this screen, its shared lookups and the ledger can reach, plus a
 * catch-all that fails the test loudly for anything unmocked. `POST
 * /inventory/transfers` really appends to the history the list reads back, so
 * "the record persists" is observable rather than assumed.
 */
async function mockTransferApi(page: Page, opts: MockOptions = {}): Promise<World> {
  const grants = opts.grants ?? ["STOCK_VIEW", "STOCK_TRANSFER"];
  const world: World = {
    requests: [],
    transfers: [existingTransfer()],
    balances: { "LOC-1:NT-1": 100, "LOC-2:NT-1": 5 },
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
      const rows = [WAREHOUSE, TROLLEY].filter((row) => !factoryId || row.factoryId === factoryId);
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

    if (path === "/inventory/transfers" && method === "GET") {
      return route.fulfill({ json: pagedEnvelope(world.transfers) });
    }

    if (path === "/inventory/transfers" && method === "POST") {
      if (opts.createFailure) {
        return route.fulfill({
          status: opts.createFailure.status,
          json: errorEnvelope(opts.createFailure.code, opts.createFailure.message),
        });
      }

      const body = request.postDataJSON() as CreateTransferBody;
      const created: TransferRow = {
        id: "TRF-2",
        factoryId: body.factoryId,
        sourceLocationId: body.sourceLocationId,
        destinationLocationId: body.destinationLocationId,
        needleTypeId: body.needleTypeId,
        quantity: body.quantity,
        referenceDocument: body.referenceDocument ?? null,
        note: body.note ?? null,
        outMovementNumber: "MV-20260916-000010",
        inMovementNumber: "MV-20260916-000011",
        createdBy: "USR-000",
        createdAt: "2026-09-16T02:00:00.000Z",
      };

      const sourceKey = `${body.sourceLocationId}:${body.needleTypeId}`;
      const destinationKey = `${body.destinationLocationId}:${body.needleTypeId}`;
      world.balances[sourceKey] = (world.balances[sourceKey] ?? 0) - body.quantity;
      world.balances[destinationKey] = (world.balances[destinationKey] ?? 0) + body.quantity;
      world.transfers.unshift(created);

      return route.fulfill({
        status: 201,
        json: envelope({
          transferId: created.id,
          outMovementNumber: created.outMovementNumber,
          inMovementNumber: created.inMovementNumber,
          factoryId: created.factoryId,
          sourceLocationId: created.sourceLocationId,
          destinationLocationId: created.destinationLocationId,
          needleTypeId: created.needleTypeId,
          quantity: created.quantity,
          referenceDocument: created.referenceDocument,
          note: created.note,
          sourceBalanceQuantity: world.balances[sourceKey],
          destinationBalanceQuantity: world.balances[destinationKey],
          createdAt: created.createdAt,
        }),
      });
    }

    if (path.startsWith("/inventory/transfers/") && method === "GET") {
      const id = path.replace("/inventory/transfers/", "");
      const row = world.transfers.find((transfer) => transfer.id === id);
      if (!row) {
        return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `Transfer not found: ${id}`) });
      }
      return route.fulfill({ json: envelope(row) });
    }

    return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `unmocked: ${method} ${path}`) });
  });

  return world;
}

/** A history row is the clickable element carrying `getRowLabel`'s accessible name. */
function historyRow(page: Page, outMovementNumber: string): Locator {
  return page.getByRole("button", { name: `View transfer ${outMovementNumber}` });
}

/** One key/value line of a ConfirmDialog's impact summary (Docs/design.md §9.7). */
function impact(dialog: Locator, label: string): Locator {
  return dialog.locator("dl > div").filter({ hasText: label }).locator("dd");
}

function listCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "GET" && request.path === "/inventory/transfers");
}

function createCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "POST" && request.path === "/inventory/transfers");
}

async function openNewTransfer(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "New Transfer" }).click();
  const dialog = page.getByRole("dialog", { name: "New Transfer" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillTransferForm(
  page: Page,
  dialog: Locator,
  opts: { destination?: RegExp; quantity?: string } = {},
): Promise<void> {
  await dialog.getByRole("combobox", { name: "Factory" }).click();
  await page.getByRole("option", { name: /Bandung Plant/ }).click();

  await dialog.getByRole("combobox", { name: "Source Location" }).click();
  await page.getByRole("option", { name: /Main Warehouse/ }).click();

  await dialog.getByRole("combobox", { name: "Destination Location" }).click();
  await page.getByRole("option", { name: opts.destination ?? /Trolley A-01/ }).click();

  await dialog.getByRole("combobox", { name: "Needle Type" }).click();
  await page.getByRole("option", { name: /DBx1/ }).click();

  await dialog.getByLabel("Quantity *", { exact: true }).fill(opts.quantity ?? "20");
}

test.describe("Inventory → Transfer: history", () => {
  test("lists each transfer with both movement numbers, its route, reference and actor", async ({ page }) => {
    await mockTransferApi(page);

    await page.goto("/inventory/transfer");

    await expect(page.getByRole("heading", { name: "Transfer" })).toBeVisible();
    const row = historyRow(page, "MV-20260915-000001");
    await expect(row).toBeVisible();
    await expect(row).toContainText("MV-20260915-000002");
    await expect(row).toContainText("WH-01 — Main Warehouse");
    await expect(row).toContainText("TRL-A-01 — Trolley A-01");
    await expect(row).toContainText("DBX1 — DBx1");
    await expect(row).toContainText("DO-0012");
    await expect(row).toContainText("Replenishment trolley");
    // The actor is a name, never a raw uuid.
    await expect(row).toContainText("Test Admin");
  });

  test("asks for page 1 of 20, unfiltered, on first load", async ({ page }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();

    const call = listCalls(world)[0];
    expect(call.params.get("page")).toBe("1");
    expect(call.params.get("pageSize")).toBe("20");
    expect(call.params.has("factoryId")).toBe(false);
    expect(call.params.has("locationId")).toBe(false);
    expect(call.params.has("dateFrom")).toBe(false);
  });

  test("sends the chosen location and widens a picked day to an inclusive local-day bound", async ({ page }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Location" }).click();
    await page.getByRole("option", { name: /Main Warehouse/ }).click();
    await page.getByLabel("Date From").fill("2026-09-01");
    await page.getByLabel("Date To").fill("2026-09-15");

    await expect
      .poll(() => {
        const call = listCalls(world).at(-1);
        return call?.params.get("locationId") === "LOC-1" && call.params.has("dateFrom") && call.params.has("dateTo");
      })
      .toBe(true);

    const call = listCalls(world).at(-1);
    expect(call?.params.get("page")).toBe("1");

    // `dateFrom`/`dateTo` are inclusive bounds on `createdAt`: a bare date would
    // read as midnight UTC and silently drop the last day.
    const from = new Date(call?.params.get("dateFrom") ?? "");
    expect([from.getFullYear(), from.getMonth() + 1, from.getDate(), from.getHours()]).toEqual([2026, 9, 1, 0]);
    const to = new Date(call?.params.get("dateTo") ?? "");
    expect([to.getFullYear(), to.getMonth() + 1, to.getDate(), to.getHours()]).toEqual([2026, 9, 15, 23]);
  });

  test("a row opens that transfer's own detail, linkable by `?id=`", async ({ page }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await historyRow(page, "MV-20260915-000001").click();

    const detail = page.getByRole("dialog", { name: "Transfer Detail" });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("MV-20260915-000001 (out) · MV-20260915-000002 (in)");
    await expect(detail).toContainText("WH-01 — Main Warehouse");
    await expect(detail).toContainText("TRL-A-01 — Trolley A-01");
    await expect(detail).toContainText("DO-0012");
    await expect(detail).toContainText("Replenishment trolley");
    await expect(page).toHaveURL(/\/inventory\/transfer\?id=TRF-1$/);
    expect(world.requests.some((request) => request.path === "/inventory/transfers/TRF-1")).toBe(true);
  });

  test("the ledger's Reference drills through to the transfer that owns the movement", async ({ page }) => {
    await mockTransferApi(page);

    await page.goto("/inventory/movement");
    const reference = page.getByRole("table").getByRole("link", { name: "Transfer" });
    await expect(reference).toHaveAttribute("href", "/inventory/transfer?id=TRF-1");

    await reference.click();
    await page.waitForURL(/\/inventory\/transfer\?id=TRF-1$/);

    await expect(page.getByRole("dialog", { name: "Transfer Detail" })).toContainText("MV-20260915-000001");
  });
});

test.describe("Inventory → Transfer: create", () => {
  test("the confirm step shows the impact computed from the server's own balances", async ({ page }) => {
    await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewTransfer(page);
    await fillTransferForm(page, dialog);

    // Live availability at the source, read while typing — the same balance
    // read the confirm dialog then does its arithmetic on.
    await expect(dialog.getByTestId("source-available")).toContainText("100");

    await dialog.getByRole("button", { name: "Review Transfer" }).click();

    const confirm = page.getByRole("dialog", { name: "Confirm Transfer" });
    await expect(impact(confirm, "Source Current")).toHaveText("100");
    await expect(impact(confirm, "Source After")).toHaveText("80");
    await expect(impact(confirm, "Destination Current")).toHaveText("5");
    await expect(impact(confirm, "Destination After")).toHaveText("25");
  });

  test("warns when the quantity exceeds the source balance without deciding the outcome", async ({ page }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewTransfer(page);
    await fillTransferForm(page, dialog, { quantity: "500" });

    await expect(dialog.getByText(/more than the source currently holds/)).toBeVisible();

    // A warning, not a block: the backend's 409 stays the authority on "enough stock".
    await dialog.getByRole("button", { name: "Review Transfer" }).click();
    await expect(page.getByRole("dialog", { name: "Confirm Transfer" })).toBeVisible();
    await page.getByRole("dialog", { name: "Confirm Transfer" }).getByRole("button", { name: "Confirm Transfer" }).click();
    await expect.poll(() => createCalls(world).length).toBe(1);
  });

  test("submits the exact payload with an Idempotency-Key, and the new transfer joins the history without a reload", async ({
    page,
  }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const listCallsBefore = listCalls(world).length;

    const dialog = await openNewTransfer(page);
    await fillTransferForm(page, dialog);
    await dialog.getByLabel("Reference Document").fill("DO-9");
    await dialog.getByLabel("Note", { exact: true }).fill("Top up");
    await dialog.getByRole("button", { name: "Review Transfer" }).click();
    await page.getByRole("dialog", { name: "Confirm Transfer" }).getByRole("button", { name: "Confirm Transfer" }).click();

    await expect(page.getByText("Transfer complete. Both balances updated.")).toBeVisible();
    await expect(page.getByText("Move stock between any two locations within the same factory.")).toHaveCount(0);

    const call = createCalls(world)[0];
    expect(call.body).toEqual({
      factoryId: "FAC-001",
      sourceLocationId: "LOC-1",
      destinationLocationId: "LOC-2",
      needleTypeId: "NT-1",
      quantity: 20,
      referenceDocument: "DO-9",
      note: "Top up",
    });
    expect(call.headers["idempotency-key"]).toBeTruthy();

    // The history re-read itself; the record is the server's, not an optimistic row.
    await expect(historyRow(page, "MV-20260916-000010")).toBeVisible();
    expect(listCalls(world).length).toBeGreaterThan(listCallsBefore);
  });

  test("refuses the same location as source and destination before any request is sent", async ({ page }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewTransfer(page);
    await fillTransferForm(page, dialog, { destination: /Main Warehouse/ });

    await dialog.getByRole("button", { name: "Review Transfer" }).click();

    await expect(dialog.getByText("Source and destination must be different locations")).toBeVisible();
    expect(createCalls(world)).toHaveLength(0);
  });

  test("refuses a quantity below 1 — the out-of-range value never reaches the server", async ({ page }) => {
    const world = await mockTransferApi(page);

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewTransfer(page);
    await fillTransferForm(page, dialog, { quantity: "0" });

    await dialog.getByRole("button", { name: "Review Transfer" }).click();

    /**
     * The quantity input carries a native `min={1}` and the form sets no
     * `noValidate`, so Chromium's own constraint validation blocks the submit
     * before react-hook-form ever runs — zod's "Quantity must be at least 1"
     * is unreachable in a real browser, even though the jsdom component test
     * sees it. The rule that matters still holds: an out-of-range quantity
     * cannot be submitted, so that is what is asserted here. (The missing
     * inline message is recorded as a design-system gap on ticket 02.)
     */
    const quantity = dialog.getByLabel("Quantity *", { exact: true });
    expect(await quantity.evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
    await expect(page.getByText("This immediately moves stock between the two locations.")).toHaveCount(0);
    expect(createCalls(world)).toHaveLength(0);
  });

  test("surfaces a 409 insufficient-stock refusal inline, and adds nothing to the history", async ({ page }) => {
    await mockTransferApi(page, {
      createFailure: {
        status: 409,
        code: "INVENTORY_INSUFFICIENT_STOCK",
        message: "Insufficient stock at location LOC-1 for needle type NT-1: 20 requested, 5 available",
      },
    });

    await page.goto("/inventory/transfer");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewTransfer(page);
    await fillTransferForm(page, dialog);
    await dialog.getByRole("button", { name: "Review Transfer" }).click();
    await page.getByRole("dialog", { name: "Confirm Transfer" }).getByRole("button", { name: "Confirm Transfer" }).click();

    await expect(page.getByRole("alert")).toContainText("Insufficient stock at location LOC-1");
    await expect(page.getByText("This immediately moves stock between the two locations.")).toHaveCount(0);
    // The form dialog stays open behind the inline error, so Radix marks the
    // history `aria-hidden` — this asserts on the DOM rather than the
    // accessibility tree, which would report 0 rows either way.
    await expect(page.locator('[aria-label^="View transfer "]')).toHaveCount(1);
  });
});

test.describe("Inventory → Transfer: permission gate", () => {
  test("a caller who may read the history but not transfer is offered no New Transfer", async ({ page }) => {
    await mockTransferApi(page, { grants: ["STOCK_VIEW"] });

    await page.goto("/inventory/transfer");

    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    await expect(page.getByRole("button", { name: "New Transfer" })).toHaveCount(0);
  });

  test("a caller without STOCK_VIEW sees access-denied, and the history is never requested", async ({ page }) => {
    const world = await mockTransferApi(page, { grants: ["STOCK_TRANSFER"] });

    await page.goto("/inventory/transfer");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(listCalls(world)).toHaveLength(0);
  });
});
