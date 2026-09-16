import { test, expect, type Locator, type Page, type Route } from "@playwright/test";
import { MOCK_SESSION_USER } from "./helpers/auth";

/**
 * `/inventory/count` and `/inventory/count/[id]` — the Physical Count
 * lifecycle (`.scratch/inventory-operation-history/spec.md` decision 6,
 * `Docs/12` §14): `OPEN | COMPLETED | CANCELLED`, a session that survives a
 * refresh because it is read from the server, a Cancel that really cancels
 * server-side rather than clearing the screen, and a Complete that reconciles
 * each variance into an adjustment the detail then lists and links to.
 *
 * `MOCK_SESSION_USER` holds no `STOCK_*` grants (`sidebar.test.tsx` depends on
 * that list); each test grants what it needs through `GET /auth/me`. Count
 * sessions read *and* write on `STOCK_COUNT` (decision 8), so one gate covers
 * the whole screen.
 */

interface Captured {
  method: string;
  path: string;
  params: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

interface CountItem {
  needleTypeId: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
}

interface SessionAdjustment {
  id: string;
  movementNumber: string;
  needleTypeId: string;
  varianceQuantity: number;
}

interface CountSession {
  id: string;
  factoryId: string;
  locationId: string;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  createdBy: string;
  completedAt: string | null;
  cancelledAt: string | null;
  itemCount: number;
  createdAt: string;
  items: CountItem[];
  adjustments: SessionAdjustment[];
}

interface AdjustmentDetail {
  id: string;
  movementNumber: string;
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  reasonCode: string;
  reason: string | null;
  systemQuantity: number | null;
  actualQuantity: number | null;
  varianceQuantity: number;
  countSessionId: string | null;
  evidenceCount: number;
  createdBy: string;
  createdAt: string;
}

interface World {
  requests: Captured[];
  sessions: CountSession[];
  adjustments: AdjustmentDetail[];
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
const NEEDLE_TYPES = [
  {
    id: "NT-1",
    code: "DBX1",
    name: "DBx1",
    status: "ACTIVE",
    category: null,
    unit: "pcs",
    minimumStock: 10,
    description: null,
  },
  {
    id: "NT-2",
    code: "DBX2",
    name: "DBx2",
    status: "ACTIVE",
    category: null,
    unit: "pcs",
    minimumStock: 10,
    description: null,
  },
];
const USERS = [
  { id: "USR-000", username: "admin", name: "Test Admin", status: "ACTIVE", roles: ["SYSTEM_ADMIN"], factoryIds: ["FAC-001"] },
];

/** An ADJUSTMENT movement written by completing a session — `referenceType` COUNT_SESSION points back at it. */
const MOVEMENT = {
  id: "MOV-ADJ-1",
  movementNumber: "MV-20260915-000030",
  movementType: "ADJUSTMENT",
  factoryId: "FAC-001",
  sourceLocationId: "LOC-2",
  destinationLocationId: null,
  needleTypeId: "NT-1",
  quantity: 5,
  referenceType: "COUNT_SESSION",
  referenceId: "CS-1",
  reason: null,
  createdBy: "USR-000",
  createdAt: "2026-09-15T09:00:00.000Z",
};

/** OPEN, at a trolley, with one counted needle type already showing a variance. */
function openSession(): CountSession {
  return {
    id: "CS-1",
    factoryId: "FAC-001",
    locationId: "LOC-2",
    status: "OPEN",
    createdBy: "USR-000",
    completedAt: null,
    cancelledAt: null,
    itemCount: 1,
    createdAt: "2026-09-15T08:00:00.000Z",
    items: [{ needleTypeId: "NT-1", systemQuantity: 90, physicalQuantity: 85, varianceQuantity: -5 }],
    adjustments: [],
  };
}

/** COMPLETED with everything matching — nothing to reconcile. */
function completedSession(): CountSession {
  return {
    id: "CS-2",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    status: "COMPLETED",
    createdBy: "USR-000",
    completedAt: "2026-09-14T09:00:00.000Z",
    cancelledAt: null,
    itemCount: 1,
    createdAt: "2026-09-14T08:00:00.000Z",
    items: [{ needleTypeId: "NT-1", systemQuantity: 40, physicalQuantity: 40, varianceQuantity: 0 }],
    adjustments: [],
  };
}

function cancelledSession(): CountSession {
  return {
    id: "CS-3",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    status: "CANCELLED",
    createdBy: "USR-000",
    completedAt: null,
    cancelledAt: "2026-09-13T10:00:00.000Z",
    itemCount: 0,
    createdAt: "2026-09-13T08:00:00.000Z",
    items: [],
    adjustments: [],
  };
}

/** `GET /inventory/count-sessions` rows are the session without `items` / `adjustments`. */
function listRow(session: CountSession) {
  const { items, adjustments, ...row } = session;
  void items;
  void adjustments;
  return row;
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
  completeFailure?: { status: number; code: string; message: string };
}

/** Every route these two screens, their lookups and the ledger can reach, plus a catch-all that fails loudly for anything unmocked. */
async function mockCountApi(page: Page, opts: MockOptions = {}): Promise<World> {
  const grants = opts.grants ?? ["STOCK_VIEW", "STOCK_COUNT"];
  const world: World = {
    requests: [],
    sessions: [openSession(), completedSession(), cancelledSession()],
    adjustments: [],
    balances: { "LOC-2:NT-1": 90, "LOC-2:NT-2": 40 },
  };

  const findSession = (id: string) => world.sessions.find((session) => session.id === id);

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
      return route.fulfill({ json: collectionEnvelope(NEEDLE_TYPES) });
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

    if (path === "/inventory/adjustments" && method === "GET") {
      return route.fulfill({ json: pagedEnvelope(world.adjustments) });
    }
    if (path.startsWith("/inventory/adjustments/") && method === "GET") {
      const id = path.replace("/inventory/adjustments/", "");
      const adjustment = world.adjustments.find((row) => row.id === id);
      if (!adjustment) {
        return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `Adjustment not found: ${id}`) });
      }
      return route.fulfill({ json: envelope({ ...adjustment, evidence: [] }) });
    }

    if (path === "/inventory/count-sessions" && method === "GET") {
      const status = url.searchParams.get("status");
      const rows = world.sessions.filter((session) => !status || session.status === status).map(listRow);
      return route.fulfill({ json: pagedEnvelope(rows) });
    }

    if (path === "/inventory/count-sessions" && method === "POST") {
      const body = request.postDataJSON() as { factoryId: string; locationId: string };
      const created: CountSession = {
        id: "CS-9",
        factoryId: body.factoryId,
        locationId: body.locationId,
        status: "OPEN",
        createdBy: "USR-000",
        completedAt: null,
        cancelledAt: null,
        itemCount: 0,
        createdAt: "2026-09-16T02:00:00.000Z",
        items: [],
        adjustments: [],
      };
      world.sessions.unshift(created);
      return route.fulfill({ status: 201, json: envelope(created) });
    }

    const sessionMatch = /^\/inventory\/count-sessions\/([^/]+)(\/items|\/complete|\/cancel)?$/.exec(path);
    if (sessionMatch) {
      const session = findSession(sessionMatch[1]);
      if (!session) {
        return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `Count session not found: ${sessionMatch[1]}`) });
      }
      const action = sessionMatch[2];

      if (!action && method === "GET") {
        return route.fulfill({ json: envelope(session) });
      }

      if (action === "/items" && method === "POST") {
        if (session.status !== "OPEN") {
          return route.fulfill({ status: 409, json: errorEnvelope("CONFLICT", "This count session is not open.") });
        }
        const body = request.postDataJSON() as { needleTypeId: string; physicalQuantity: number };
        const systemQuantity = world.balances[`${session.locationId}:${body.needleTypeId}`] ?? 0;
        const item: CountItem = {
          needleTypeId: body.needleTypeId,
          systemQuantity,
          physicalQuantity: body.physicalQuantity,
          varianceQuantity: body.physicalQuantity - systemQuantity,
        };
        // Re-counting a needle type replaces its item, per the contract.
        session.items = [...session.items.filter((row) => row.needleTypeId !== item.needleTypeId), item];
        session.itemCount = session.items.length;
        return route.fulfill({ status: 201, json: envelope(session) });
      }

      if (action === "/complete" && method === "POST") {
        if (opts.completeFailure) {
          return route.fulfill({
            status: opts.completeFailure.status,
            json: errorEnvelope(opts.completeFailure.code, opts.completeFailure.message),
          });
        }
        session.status = "COMPLETED";
        session.completedAt = "2026-09-16T02:05:00.000Z";
        session.adjustments = session.items
          .filter((item) => item.varianceQuantity !== 0)
          .map((item, index) => ({
            id: `MV-ADJ-${index + 1}`,
            movementNumber: `MV-20260916-00002${index}`,
            needleTypeId: item.needleTypeId,
            varianceQuantity: item.varianceQuantity,
          }));
        // Each ADJUSTMENT the session wrote is a real adjustment the ledger and
        // `/inventory/adjustment?id=` can resolve — reason code PHYSICAL_COUNT,
        // no evidence, the session itself is the evidence.
        for (let index = 0; index < session.adjustments.length; index += 1) {
          const adjustment = session.adjustments[index];
          const item = session.items.find((row) => row.needleTypeId === adjustment.needleTypeId) as CountItem;
          world.balances[`${session.locationId}:${item.needleTypeId}`] = item.physicalQuantity;
          world.adjustments.unshift({
            id: adjustment.id,
            movementNumber: adjustment.movementNumber,
            factoryId: session.factoryId,
            locationId: session.locationId,
            needleTypeId: item.needleTypeId,
            reasonCode: "PHYSICAL_COUNT",
            reason: null,
            systemQuantity: item.systemQuantity,
            actualQuantity: item.physicalQuantity,
            varianceQuantity: item.varianceQuantity,
            countSessionId: session.id,
            evidenceCount: 0,
            createdBy: "USR-000",
            createdAt: `2026-09-16T02:0${5 + index}:00.000Z`,
          });
        }
        return route.fulfill({
          json: envelope({
            factoryId: session.factoryId,
            session,
            adjustmentMovementIds: session.adjustments.map((adjustment) => adjustment.id),
          }),
        });
      }

      if (action === "/cancel" && method === "POST") {
        if (session.status !== "OPEN") {
          return route.fulfill({ status: 409, json: errorEnvelope("CONFLICT", "Only an open session can be cancelled.") });
        }
        session.status = "CANCELLED";
        session.cancelledAt = "2026-09-16T02:10:00.000Z";
        return route.fulfill({ json: envelope(session) });
      }
    }

    return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `unmocked: ${method} ${path}`) });
  });

  return world;
}

function impact(dialog: Locator, label: string): Locator {
  return dialog.locator("dl > div").filter({ hasText: label }).locator("dd");
}

/** The live System / Physical / Variance preview on an open session. */
function preview(page: Page, label: string): Locator {
  return page.locator("dl > div").filter({ hasText: label }).locator("dd");
}

function listCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "GET" && request.path === "/inventory/count-sessions");
}

test.describe("Inventory → Physical Count: session list", () => {
  test("lands on the open sessions, so an unfinished count is the first thing offered", async ({ page }) => {
    const world = await mockCountApi(page);

    await page.goto("/inventory/count");

    await expect(page.getByRole("heading", { name: "Physical Count" })).toBeVisible();
    const row = page.getByRole("link", { name: /Trolley A-01/ });
    await expect(row).toBeVisible();
    // The location's type, so a trolley is recognisable at a glance.
    await expect(row).toContainText("Trolley");
    await expect(row).toContainText("Open");
    await expect(row.locator("td").nth(3)).toHaveText("1");
    await expect(row).toContainText("Test Admin");
    expect(listCalls(world)[0].params.get("status")).toBe("OPEN");
  });

  /**
   * The row-to-route path, which is how an open count is resumed. Worth its own
   * test because this list uses `DataTable`'s `getRowHref` (a `role="link"` row
   * that calls `router.push`), a different code path from the `onRowClick`
   * rows the other three inventory histories use.
   */
  test("a row opens that session's own route, so an open count can be resumed", async ({ page }) => {
    await mockCountApi(page);

    await page.goto("/inventory/count");
    const row = page.getByRole("link", { name: /Trolley A-01/ });
    await expect(row).toBeVisible();

    await row.click();

    await page.waitForURL(/\/inventory\/count\/CS-1$/);
    await expect(page.getByRole("button", { name: "Record Count" })).toBeVisible();
  });

  test("the status tabs walk the whole lifecycle: open, completed, cancelled, all", async ({ page }) => {
    const world = await mockCountApi(page);

    await page.goto("/inventory/count");
    await expect(page.getByRole("link", { name: /Trolley A-01/ })).toBeVisible();

    await page.getByRole("tab", { name: "Completed" }).click();
    await expect.poll(() => listCalls(world).at(-1)?.params.get("status")).toBe("COMPLETED");
    await expect(page.getByRole("link", { name: /Main Warehouse/ })).toContainText("Completed");

    await page.getByRole("tab", { name: "Cancelled" }).click();
    await expect.poll(() => listCalls(world).at(-1)?.params.get("status")).toBe("CANCELLED");
    const cancelled = page.getByRole("link", { name: /Main Warehouse/ });
    await expect(cancelled).toContainText("Cancelled");
    // Its own cancelled timestamp, in the Completed / Cancelled column.
    await expect(cancelled.locator("td").nth(5)).not.toHaveText("—");

    await page.getByRole("tab", { name: "All" }).click();
    await expect.poll(() => listCalls(world).at(-1)?.params.has("status")).toBe(false);
    await expect(page.getByRole("link", { name: /Trolley A-01/ })).toBeVisible();
  });

  test("Start Count opens a session on the server and lands on its own route", async ({ page }) => {
    const world = await mockCountApi(page);

    await page.goto("/inventory/count");
    await expect(page.getByRole("link", { name: /Trolley A-01/ })).toBeVisible();

    await page.getByRole("button", { name: "Start Count" }).click();
    const dialog = page.getByRole("dialog", { name: "Start Count Session" });
    await dialog.getByRole("combobox", { name: "Factory" }).click();
    await page.getByRole("option", { name: /Bandung Plant/ }).click();
    await dialog.getByRole("combobox", { name: "Location" }).click();
    await page.getByRole("option", { name: /Trolley A-01/ }).click();
    await dialog.getByRole("button", { name: "Start Session" }).click();

    await page.waitForURL(/\/inventory\/count\/CS-9$/);
    await expect(page.getByRole("heading", { name: "Count Session" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Record Count" })).toBeVisible();

    const call = world.requests.find((request) => request.method === "POST" && request.path === "/inventory/count-sessions");
    expect(call?.body).toEqual({ factoryId: "FAC-001", locationId: "LOC-2" });
    expect(call?.headers["idempotency-key"]).toBeTruthy();
  });

  test("the ledger's Reference drills through to the count session that wrote the adjustment", async ({ page }) => {
    await mockCountApi(page);

    await page.goto("/inventory/movement");
    const reference = page.getByRole("table").getByRole("link", { name: "Physical Count" });
    await expect(reference).toHaveAttribute("href", "/inventory/count/CS-1");

    await reference.click();
    await page.waitForURL(/\/inventory\/count\/CS-1$/);

    await expect(page.getByRole("heading", { name: "Count Session" })).toBeVisible();
    await expect(page.getByText("TRL-A-01 — Trolley A-01").first()).toBeVisible();
  });
});

test.describe("Inventory → Physical Count: an open session", () => {
  test("records a physical count against the server's system quantity, and resumes it after a refresh", async ({
    page,
  }) => {
    const world = await mockCountApi(page);

    await page.goto("/inventory/count/CS-1");
    await expect(page.getByRole("button", { name: "Record Count" })).toBeVisible();

    await page.getByRole("combobox", { name: "Needle Type" }).click();
    await page.getByRole("option", { name: /DBx2/ }).click();

    // System quantity is the server's balance, never a client guess.
    await expect(preview(page, "System Quantity")).toHaveText("40");
    await page.getByLabel("Physical Quantity *").fill("36");
    await expect(preview(page, "Variance")).toHaveText("-4");

    await page.getByRole("button", { name: "Record Count" }).click();

    const call = world.requests.find(
      (request) => request.method === "POST" && request.path === "/inventory/count-sessions/CS-1/items",
    );
    expect(call?.body).toEqual({ needleTypeId: "NT-2", physicalQuantity: 36 });
    await expect(page.getByRole("cell", { name: "36" })).toBeVisible();

    // A refresh resumes the session from the server — the old bug lost it.
    await page.reload();
    await expect(page.getByRole("button", { name: "Record Count" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "36" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "85" })).toBeVisible();
  });

  test("completing a session with a variance writes the adjustments the detail then lists and links to", async ({
    page,
  }) => {
    await mockCountApi(page);

    await page.goto("/inventory/count/CS-1");
    await page.getByRole("button", { name: "Complete Count" }).click();

    const confirm = page.getByRole("dialog", { name: "Complete Count Session" });
    await expect(impact(confirm, "Needle Types Counted")).toHaveText("1");
    await expect(impact(confirm, "With Variance")).toHaveText("1");
    await confirm.getByRole("button", { name: "Complete Count" }).click();

    await expect(page.getByText("Count complete. 1 adjustment(s) created for the variance found.")).toBeVisible();

    // Read-only afterwards, and the adjustments are the server's, read back.
    await expect(page.getByRole("button", { name: "Record Count" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel Session" })).toHaveCount(0);
    await expect(page.getByText("Adjustments Created")).toBeVisible();

    const adjustmentLink = page.getByRole("link", { name: "MV-20260916-000020" });
    await expect(adjustmentLink).toHaveAttribute("href", "/inventory/adjustment?id=MV-ADJ-1");
    await adjustmentLink.click();
    await page.waitForURL(/\/inventory\/adjustment\?id=MV-ADJ-1$/);

    const detail = page.getByRole("dialog", { name: "Adjustment Detail" });
    await expect(detail).toContainText("MV-20260916-000020");
    await expect(detail).toContainText("Physical Count");
    await expect(detail).toContainText("90 → 85");
    await expect(detail.getByRole("link", { name: "Open count session" })).toHaveAttribute("href", "/inventory/count/CS-1");
  });

  test("cancelling really cancels the session server-side, and it stays cancelled after a refresh", async ({ page }) => {
    const world = await mockCountApi(page);

    await page.goto("/inventory/count/CS-1");
    await page.getByRole("button", { name: "Cancel Session" }).click();

    const confirm = page.getByRole("dialog", { name: "Cancel Count Session" });
    await confirm.getByRole("button", { name: "Cancel Session" }).click();

    await expect(page.getByText("This session was cancelled. No stock was changed.")).toBeVisible();
    expect(
      world.requests.some(
        (request) => request.method === "POST" && request.path === "/inventory/count-sessions/CS-1/cancel",
      ),
    ).toBe(true);
    // Cancelling moves no stock: nothing was reconciled.
    await expect(page.getByText("Adjustments Created")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record Count" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText("This session was cancelled. No stock was changed.")).toBeVisible();
  });

  test("a 409 from complete is surfaced inline rather than pretended away", async ({ page }) => {
    await mockCountApi(page, {
      completeFailure: {
        status: 409,
        code: "CONFLICT",
        message: "A balance changed since it was counted. Recount before completing.",
      },
    });

    await page.goto("/inventory/count/CS-1");
    await page.getByRole("button", { name: "Complete Count" }).click();
    await page
      .getByRole("dialog", { name: "Complete Count Session" })
      .getByRole("button", { name: "Complete Count" })
      .click();

    // Scoped to the screen's own error paragraph: Next.js's route announcer is
    // `role="alert"` too, and with no modal open nothing hides it from the
    // accessibility tree.
    await expect(page.locator('p[role="alert"]')).toContainText("A balance changed since it was counted");
    // Still open — the session is whatever the server says it is.
    await expect(page.getByRole("button", { name: "Record Count" })).toBeVisible();
  });
});

test.describe("Inventory → Physical Count: a closed session", () => {
  test("a completed session with no variance says so rather than showing an empty table", async ({ page }) => {
    await mockCountApi(page);

    await page.goto("/inventory/count/CS-2");

    await expect(page.getByText("Counted Items")).toBeVisible();
    await expect(page.getByText("No variance found — no adjustment was needed.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Record Count" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Complete Count" })).toHaveCount(0);
  });
});

test.describe("Inventory → Physical Count: permission gate", () => {
  test("a caller without STOCK_COUNT sees access-denied, is offered no Start Count, and the list is never requested", async ({
    page,
  }) => {
    const world = await mockCountApi(page, { grants: ["STOCK_VIEW"] });

    await page.goto("/inventory/count");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Count" })).toHaveCount(0);
    expect(listCalls(world)).toHaveLength(0);
  });

  test("typing a session's URL without STOCK_COUNT is refused too, and the session is never requested", async ({
    page,
  }) => {
    const world = await mockCountApi(page, { grants: ["STOCK_VIEW"] });

    await page.goto("/inventory/count/CS-1");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(world.requests.some((request) => request.path === "/inventory/count-sessions/CS-1")).toBe(false);
  });
});
