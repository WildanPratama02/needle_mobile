import { test, expect, type Locator, type Page, type Route } from "@playwright/test";
import { MOCK_SESSION_USER } from "./helpers/auth";

/**
 * `/inventory/receiving`, rebuilt history-first
 * (`.scratch/receiving-supplier/issues/03`), driven against mocked `/api/v1`
 * routes — there is no live Backend in this environment, so the mock *is* the
 * contract (`Docs/12` §13).
 *
 * These assert business behaviour rather than rendering: a recorded receiving
 * joins the history without a reload, it carries the supplier it was given, a
 * receiving with no supplier and a receiving dated tomorrow both die in the
 * browser, and the ledger row and the receiving detail each link to the other.
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

interface ReceivingRow {
  id: string;
  movementNumber: string;
  factoryId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  supplierId: string | null;
  receivedDate: string;
  referenceDocument: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
}

interface CreateReceivingBody {
  factoryId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  supplierId: string;
  receivedDate?: string;
  referenceDocument?: string;
  note?: string;
}

interface World {
  requests: Captured[];
  receivings: ReceivingRow[];
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
/** No `status`: a supplier is never deactivated (`.scratch/receiving-supplier` decision 6). */
const SUPPLIERS = [
  { id: "SUP-1", code: "SUP-ACME", name: "Acme Needles", contact: "sales@acme.example", description: null },
  { id: "SUP-2", code: "SUP-BOLT", name: "Bolt Supplies", contact: null, description: null },
];
const USERS = [
  {
    id: "USR-000",
    username: "admin",
    name: "Test Admin",
    status: "ACTIVE",
    roles: ["SYSTEM_ADMIN"],
    factoryIds: ["FAC-001"],
  },
];

/** The RECEIVING movement in the ledger, pointing at the receiving header it belongs to. */
const MOVEMENT = {
  id: "MOV-1",
  movementNumber: "MV-20260915-000001",
  movementType: "RECEIVING",
  factoryId: "FAC-001",
  sourceLocationId: null,
  destinationLocationId: "LOC-1",
  needleTypeId: "NT-1",
  quantity: 500,
  referenceType: "RECEIVING",
  referenceId: "RCV-1",
  reason: "GR-00001 — First delivery of the quarter",
  createdBy: "USR-000",
  createdAt: "2026-09-15T08:00:00.000Z",
};

function existingReceiving(): ReceivingRow {
  return {
    id: "RCV-1",
    movementNumber: "MV-20260915-000001",
    factoryId: "FAC-001",
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 500,
    supplierId: "SUP-1",
    receivedDate: "2026-09-12",
    referenceDocument: "GR-00001",
    note: "First delivery of the quarter",
    createdBy: "USR-000",
    createdAt: "2026-09-15T08:00:00.000Z",
  };
}

/** Recorded before the supplier existed — the backfill could not invent one (`Docs/12` §13). */
function legacyReceiving(): ReceivingRow {
  return {
    id: "RCV-0",
    movementNumber: "MV-20260901-000001",
    factoryId: "FAC-001",
    destinationLocationId: "LOC-1",
    needleTypeId: "NT-1",
    quantity: 100,
    supplierId: null,
    receivedDate: "2026-09-01",
    referenceDocument: null,
    note: null,
    createdBy: "USR-000",
    createdAt: "2026-09-01T08:00:00.000Z",
  };
}

function jsonBody(route: Route): unknown {
  try {
    return route.request().postDataJSON();
  } catch {
    return null;
  }
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

function shiftDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

interface MockOptions {
  /** Added on top of `MOCK_SESSION_USER`'s own grants. */
  grants?: string[];
  createFailure?: { status: number; code: string; message: string };
  withLegacyRow?: boolean;
}

/**
 * Every route this screen, its shared lookups and the ledger can reach, plus a
 * catch-all that fails the test loudly for anything unmocked. `POST
 * /inventory/receivings` really appends to the history the list reads back, and
 * the list really honours `supplierId`, so "the record persists" and "the
 * filter filters" are observable rather than assumed.
 */
async function mockReceivingApi(page: Page, opts: MockOptions = {}): Promise<World> {
  const grants = opts.grants ?? ["STOCK_VIEW", "STOCK_RECEIVE"];
  const world: World = {
    requests: [],
    receivings: opts.withLegacyRow ? [existingReceiving(), legacyReceiving()] : [existingReceiving()],
    balances: { "LOC-1:NT-1": 100 },
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
      const locationType = url.searchParams.get("locationType");
      const rows = [WAREHOUSE, TROLLEY].filter(
        (row) =>
          (!factoryId || row.factoryId === factoryId) && (!locationType || row.locationType === locationType),
      );
      return route.fulfill({ json: collectionEnvelope(rows) });
    }
    if (path === "/needle-types" && method === "GET") {
      return route.fulfill({ json: collectionEnvelope([NEEDLE_TYPE]) });
    }
    if (path === "/suppliers" && method === "GET") {
      // The real endpoint answers any filter but page/pageSize with a 400 —
      // mirrored, so a client that ever started sending one would fail here
      // rather than quietly work against a permissive mock.
      for (const name of ["status", "factoryId", "locationType"]) {
        if (url.searchParams.has(name)) {
          return route.fulfill({
            status: 400,
            json: errorEnvelope("VALIDATION_ERROR", `property ${name} should not exist`),
          });
        }
      }
      return route.fulfill({ json: collectionEnvelope(SUPPLIERS) });
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
      const referenceId = url.searchParams.get("referenceId");
      const rows = referenceId ? [MOVEMENT].filter((row) => row.referenceId === referenceId) : [MOVEMENT];
      return route.fulfill({ json: pagedEnvelope(rows) });
    }

    if (path === "/inventory/receivings" && method === "GET") {
      const supplierId = url.searchParams.get("supplierId");
      const rows = supplierId
        ? world.receivings.filter((row) => row.supplierId === supplierId)
        : world.receivings;
      return route.fulfill({ json: pagedEnvelope(rows) });
    }

    if (path === "/inventory/receivings" && method === "POST") {
      if (opts.createFailure) {
        return route.fulfill({
          status: opts.createFailure.status,
          json: errorEnvelope(opts.createFailure.code, opts.createFailure.message),
        });
      }

      const body = request.postDataJSON() as CreateReceivingBody;
      const created: ReceivingRow = {
        id: "RCV-2",
        movementNumber: "MV-20260916-000010",
        factoryId: body.factoryId,
        destinationLocationId: body.destinationLocationId,
        needleTypeId: body.needleTypeId,
        quantity: body.quantity,
        supplierId: body.supplierId,
        receivedDate: body.receivedDate ?? today(),
        referenceDocument: body.referenceDocument ?? null,
        note: body.note ?? null,
        createdBy: "USR-000",
        createdAt: "2026-09-16T02:00:00.000Z",
      };

      const key = `${body.destinationLocationId}:${body.needleTypeId}`;
      world.balances[key] = (world.balances[key] ?? 0) + body.quantity;
      world.receivings.unshift(created);

      return route.fulfill({
        status: 201,
        json: envelope({
          receivingId: created.id,
          movementId: "MOV-10",
          movementNumber: created.movementNumber,
          factoryId: created.factoryId,
          destinationLocationId: created.destinationLocationId,
          needleTypeId: created.needleTypeId,
          quantity: created.quantity,
          supplierId: created.supplierId,
          receivedDate: created.receivedDate,
          referenceDocument: created.referenceDocument,
          note: created.note,
          balanceQuantity: world.balances[key],
          createdAt: created.createdAt,
        }),
      });
    }

    if (path.startsWith("/inventory/receivings/") && method === "GET") {
      const id = path.replace("/inventory/receivings/", "");
      const row = world.receivings.find((receiving) => receiving.id === id);
      if (!row) {
        return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `Receiving not found: ${id}`) });
      }
      return route.fulfill({ json: envelope(row) });
    }

    return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `unmocked: ${method} ${path}`) });
  });

  return world;
}

/** A history row is the clickable element carrying `getRowLabel`'s accessible name. */
function historyRow(page: Page, movementNumber: string): Locator {
  return page.getByRole("button", { name: `View receiving ${movementNumber}` });
}

/** One key/value line of a ConfirmDialog's impact summary (Docs/design.md §9.7). */
function impact(dialog: Locator, label: string): Locator {
  return dialog.locator("dl > div").filter({ hasText: label }).locator("dd");
}

function listCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "GET" && request.path === "/inventory/receivings");
}

function createCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "POST" && request.path === "/inventory/receivings");
}

async function openNewReceiving(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "New Receiving" }).click();
  const dialog = page.getByRole("dialog", { name: "New Receiving" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillReceivingForm(
  page: Page,
  dialog: Locator,
  opts: { supplier?: RegExp | null; quantity?: string; receivedDate?: string } = {},
): Promise<void> {
  await dialog.getByRole("combobox", { name: "Factory" }).click();
  await page.getByRole("option", { name: /Bandung Plant/ }).click();

  if (opts.supplier !== null) {
    await dialog.getByRole("combobox", { name: "Supplier" }).click();
    await page.getByRole("option", { name: opts.supplier ?? /Acme Needles/ }).click();
  }

  if (opts.receivedDate) {
    await dialog.getByLabel("Received Date *", { exact: true }).fill(opts.receivedDate);
  }

  await dialog.getByRole("combobox", { name: "Destination Location" }).click();
  await page.getByRole("option", { name: /Main Warehouse/ }).click();

  await dialog.getByRole("combobox", { name: "Needle Type" }).click();
  await page.getByRole("option", { name: /DBx1/ }).click();

  await dialog.getByLabel("Quantity *", { exact: true }).fill(opts.quantity ?? "20");
}

test.describe("Inventory → Receiving: history", () => {
  test("lists each receiving with its supplier, received date, destination, reference and actor", async ({ page }) => {
    await mockReceivingApi(page);

    await page.goto("/inventory/receiving");

    await expect(page.getByRole("heading", { name: "Receiving" })).toBeVisible();
    const row = historyRow(page, "MV-20260915-000001");
    await expect(row).toBeVisible();
    // The business day of arrival, earlier than the day the row was typed —
    // the whole reason both columns exist.
    await expect(row).toContainText("12 Sep 2026");
    await expect(row).toContainText("SUP-ACME — Acme Needles");
    await expect(row).toContainText("WH-01 — Main Warehouse");
    await expect(row).toContainText("DBX1 — DBx1");
    await expect(row).toContainText("GR-00001");
    // The actor is a name, never a raw uuid.
    await expect(row).toContainText("Test Admin");
  });

  test("says a legacy receiving recorded no supplier rather than leaving the cell blank", async ({ page }) => {
    await mockReceivingApi(page, { withLegacyRow: true });

    await page.goto("/inventory/receiving");

    await expect(historyRow(page, "MV-20260901-000001")).toContainText("Not recorded");
  });

  test("asks for page 1 of 20, unfiltered, on first load", async ({ page }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();

    const call = listCalls(world)[0];
    expect(call.params.get("page")).toBe("1");
    expect(call.params.get("pageSize")).toBe("20");
    expect(call.params.has("supplierId")).toBe(false);
    expect(call.params.has("factoryId")).toBe(false);
    expect(call.params.has("dateFrom")).toBe(false);
  });

  test("filters by supplier server-side, and widens a picked day to an inclusive local-day bound", async ({ page }) => {
    const world = await mockReceivingApi(page, { withLegacyRow: true });

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260901-000001")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Supplier" }).click();
    await page.getByRole("option", { name: /Acme Needles/ }).click();

    // The legacy row has no supplier, so the server drops it — the list is the
    // server's answer, not a client-side filter over what was already fetched.
    await expect(historyRow(page, "MV-20260901-000001")).toHaveCount(0);
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    expect(listCalls(world).at(-1)?.params.get("supplierId")).toBe("SUP-1");

    await page.getByLabel("Date From").fill("2026-09-01");
    await page.getByLabel("Date To").fill("2026-09-15");

    await expect
      .poll(() => {
        const call = listCalls(world).at(-1);
        return call?.params.has("dateFrom") === true && call.params.has("dateTo") === true;
      })
      .toBe(true);

    // `dateFrom`/`dateTo` are inclusive bounds on `createdAt`: a bare date
    // would read as midnight UTC and silently drop the last day.
    const call = listCalls(world).at(-1);
    expect(call?.params.get("page")).toBe("1");
    const from = new Date(call?.params.get("dateFrom") ?? "");
    expect([from.getFullYear(), from.getMonth() + 1, from.getDate(), from.getHours()]).toEqual([2026, 9, 1, 0]);
    const to = new Date(call?.params.get("dateTo") ?? "");
    expect([to.getFullYear(), to.getMonth() + 1, to.getDate(), to.getHours()]).toEqual([2026, 9, 15, 23]);
  });

  test("a row opens that receiving's own detail, linkable by `?id=`", async ({ page }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await historyRow(page, "MV-20260915-000001").click();

    const detail = page.getByRole("dialog", { name: "Receiving Detail" });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("SUP-ACME — Acme Needles");
    await expect(detail).toContainText("12 Sep 2026");
    await expect(detail).toContainText("WH-01 — Main Warehouse");
    await expect(detail).toContainText("GR-00001");
    await expect(detail).toContainText("First delivery of the quarter");
    await expect(page).toHaveURL(/\/inventory\/receiving\?id=RCV-1$/);
    expect(world.requests.some((request) => request.path === "/inventory/receivings/RCV-1")).toBe(true);
  });
});

test.describe("Inventory → Receiving: ledger linkage", () => {
  test("the ledger's Reference drills through to the receiving that owns the movement", async ({ page }) => {
    await mockReceivingApi(page);

    await page.goto("/inventory/movement");
    const reference = page.getByRole("table").getByRole("link", { name: "Receiving" });
    await expect(reference).toHaveAttribute("href", "/inventory/receiving?id=RCV-1");

    await reference.click();
    await page.waitForURL(/\/inventory\/receiving\?id=RCV-1$/);

    await expect(page.getByRole("dialog", { name: "Receiving Detail" })).toContainText("MV-20260915-000001");
  });

  test("the receiving detail links back to its own movement in the ledger", async ({ page }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving?id=RCV-1");
    const detail = page.getByRole("dialog", { name: "Receiving Detail" });
    await expect(detail).toBeVisible();

    await detail.getByRole("link", { name: /Open in Stock Movement/ }).click();
    await page.waitForURL(/\/inventory\/movement\?referenceId=RCV-1$/);

    // Narrowed to one operation, and narrowed by the server: `referenceId` is
    // a real filter on `GET /inventory/movements`, not a client-side scan.
    await expect(page.getByTestId("reference-narrowed")).toBeVisible();
    await expect(page.getByRole("table")).toContainText("MV-20260915-000001");
    expect(
      world.requests.some(
        (request) => request.path === "/inventory/movements" && request.params.get("referenceId") === "RCV-1",
      ),
    ).toBe(true);
  });
});

test.describe("Inventory → Receiving: create", () => {
  test("the confirm step shows the impact computed from the server's own balance", async ({ page }) => {
    await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewReceiving(page);
    await fillReceivingForm(page, dialog);

    await dialog.getByRole("button", { name: "Review Receiving" }).click();

    const confirm = page.getByRole("dialog", { name: "Confirm Receiving" });
    await expect(impact(confirm, "Current Balance")).toHaveText("100");
    await expect(impact(confirm, "Receive")).toHaveText("+20");
    await expect(impact(confirm, "New Balance")).toHaveText("120");
  });

  test("submits the exact payload with an Idempotency-Key, and the new receiving joins the history without a reload", async ({
    page,
  }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const listCallsBefore = listCalls(world).length;

    const dialog = await openNewReceiving(page);
    await fillReceivingForm(page, dialog);
    await dialog.getByLabel("Reference Document").fill("GR-9");
    await dialog.getByLabel("Note", { exact: true }).fill("Pallet 3");
    await dialog.getByRole("button", { name: "Review Receiving" }).click();
    await page.getByRole("dialog", { name: "Confirm Receiving" }).getByRole("button", { name: "Confirm Receiving" }).click();

    await expect(page.getByText("Receiving recorded. Stock balance updated.")).toBeVisible();
    await expect(page.getByText("Record stock arriving from a supplier into a warehouse.")).toHaveCount(0);

    const call = createCalls(world)[0];
    expect(call.body).toEqual({
      factoryId: "FAC-001",
      destinationLocationId: "LOC-1",
      needleTypeId: "NT-1",
      quantity: 20,
      supplierId: "SUP-1",
      // Defaulted to today by the form and sent explicitly, rather than left
      // to the backend's own default.
      receivedDate: today(),
      referenceDocument: "GR-9",
      note: "Pallet 3",
    });
    expect(call.headers["idempotency-key"]).toBeTruthy();

    // The history re-read itself; the row is the server's, not an optimistic one.
    const created = historyRow(page, "MV-20260916-000010");
    await expect(created).toBeVisible();
    await expect(created).toContainText("SUP-ACME — Acme Needles");
    expect(listCalls(world).length).toBeGreaterThan(listCallsBefore);
  });

  test("accepts a backdated received date — a Friday delivery entered on Monday", async ({ page }) => {
    const world = await mockReceivingApi(page);
    const backdated = shiftDays(-3);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewReceiving(page);
    await fillReceivingForm(page, dialog, { receivedDate: backdated });
    await dialog.getByRole("button", { name: "Review Receiving" }).click();
    await page.getByRole("dialog", { name: "Confirm Receiving" }).getByRole("button", { name: "Confirm Receiving" }).click();

    await expect.poll(() => createCalls(world).length).toBe(1);
    expect((createCalls(world)[0].body as CreateReceivingBody).receivedDate).toBe(backdated);
  });

  test("refuses a receiving with no supplier before any request is sent", async ({ page }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewReceiving(page);
    await fillReceivingForm(page, dialog, { supplier: null });

    await dialog.getByRole("button", { name: "Review Receiving" }).click();

    await expect(dialog.getByText("Supplier is required")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Confirm Receiving" })).toHaveCount(0);
    expect(createCalls(world)).toHaveLength(0);
  });

  test("refuses a future received date before any request is sent", async ({ page }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewReceiving(page);
    await fillReceivingForm(page, dialog, { receivedDate: shiftDays(1) });

    await dialog.getByRole("button", { name: "Review Receiving" }).click();

    await expect(dialog.getByText("Received date cannot be in the future")).toBeVisible();
    expect(createCalls(world)).toHaveLength(0);
  });

  test("offers only warehouses as a destination — a receiving lands nowhere else", async ({ page }) => {
    const world = await mockReceivingApi(page);

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewReceiving(page);
    await dialog.getByRole("combobox", { name: "Factory" }).click();
    await page.getByRole("option", { name: /Bandung Plant/ }).click();
    await dialog.getByRole("combobox", { name: "Destination Location" }).click();

    await expect(page.getByRole("option", { name: /Main Warehouse/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Trolley A-01/ })).toHaveCount(0);

    // Narrowed by the endpoint, not by filtering a fetched list — a factory
    // with more locations than one page would otherwise lose options silently.
    expect(
      world.requests.some(
        (request) => request.path === "/locations" && request.params.get("locationType") === "WAREHOUSE",
      ),
    ).toBe(true);
  });

  test("surfaces an unknown-supplier refusal inline, and adds nothing to the history", async ({ page }) => {
    await mockReceivingApi(page, {
      createFailure: { status: 400, code: "VALIDATION_ERROR", message: "Supplier not found: SUP-1" },
    });

    await page.goto("/inventory/receiving");
    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    const dialog = await openNewReceiving(page);
    await fillReceivingForm(page, dialog);
    await dialog.getByRole("button", { name: "Review Receiving" }).click();
    await page.getByRole("dialog", { name: "Confirm Receiving" }).getByRole("button", { name: "Confirm Receiving" }).click();

    await expect(page.getByRole("alert")).toContainText("Supplier not found: SUP-1");
    // The form dialog stays open behind the inline error, so Radix marks the
    // history `aria-hidden` — this asserts on the DOM rather than the
    // accessibility tree, which would report 0 rows either way.
    await expect(page.locator('[aria-label^="View receiving "]')).toHaveCount(1);
  });
});

test.describe("Inventory → Receiving: permission gate", () => {
  test("a caller who may read the history but not receive is offered no New Receiving", async ({ page }) => {
    await mockReceivingApi(page, { grants: ["STOCK_VIEW"] });

    await page.goto("/inventory/receiving");

    await expect(historyRow(page, "MV-20260915-000001")).toBeVisible();
    await expect(page.getByRole("button", { name: "New Receiving" })).toHaveCount(0);
  });

  test("a caller without STOCK_VIEW sees access-denied, and the history is never requested", async ({ page }) => {
    const world = await mockReceivingApi(page, { grants: ["STOCK_RECEIVE"] });

    await page.goto("/inventory/receiving");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(listCalls(world)).toHaveLength(0);
  });
});
