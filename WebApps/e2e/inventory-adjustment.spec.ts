import { test, expect, type Locator, type Page, type Route } from "@playwright/test";
import { MOCK_SESSION_USER } from "./helpers/auth";

/**
 * `/inventory/adjustment`, history-first. The rules under test are the ones
 * `.scratch/inventory-operation-history/spec.md` added (decisions 3–4,
 * `Docs/12` §13): a reason code is mandatory, `OTHER` needs a note, and a
 * manual adjustment cannot be made without evidence — each file uploaded
 * first, then cited by id. Adjustments a count session wrote are listed too,
 * need no evidence, and link back to the session.
 *
 * `MOCK_SESSION_USER` holds no `STOCK_*` grants (`sidebar.test.tsx` depends on
 * that list); each test grants what it needs through `GET /auth/me`.
 */

interface Captured {
  method: string;
  path: string;
  params: URLSearchParams;
  body: unknown;
  raw: string | null;
  headers: Record<string, string>;
}

interface AdjustmentEvidence {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

interface AdjustmentRow {
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

interface CreateAdjustmentBody {
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  actualQuantity: number;
  reasonCode: string;
  reason?: string;
  evidenceIds: string[];
}

interface World {
  requests: Captured[];
  adjustments: AdjustmentRow[];
  evidence: Record<string, AdjustmentEvidence[]>;
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
const LOCATION = {
  id: "LOC-1",
  code: "WH-01",
  name: "Main Warehouse",
  status: "ACTIVE",
  factoryId: "FAC-001",
  locationType: "WAREHOUSE",
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

const EVIDENCE_URL = "https://evidence.test/count-sheet.jpg";
/** 1×1 transparent PNG — the presigned URL points outside `/api/v1`, so it gets its own route rather than escaping the test. */
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** An ADJUSTMENT movement in the ledger. `referenceId` is the adjustment header; the drill-through uses the movement's own id. */
const MOVEMENT = {
  id: "MV-ID-1",
  movementNumber: "MV-20260915-000003",
  movementType: "ADJUSTMENT",
  factoryId: "FAC-001",
  sourceLocationId: "LOC-1",
  destinationLocationId: null,
  needleTypeId: "NT-1",
  quantity: 5,
  referenceType: "ADJUSTMENT",
  referenceId: "ADJ-HEADER-1",
  reason: "Bent in drawer",
  createdBy: "USR-000",
  createdAt: "2026-09-15T08:00:00.000Z",
};

function manualAdjustment(): AdjustmentRow {
  return {
    id: "MV-ID-1",
    movementNumber: "MV-20260915-000003",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    needleTypeId: "NT-1",
    reasonCode: "DAMAGED",
    reason: "Bent in drawer",
    systemQuantity: 100,
    actualQuantity: 95,
    varianceQuantity: -5,
    countSessionId: null,
    evidenceCount: 1,
    createdBy: "USR-000",
    createdAt: "2026-09-15T08:00:00.000Z",
  };
}

function countSessionAdjustment(): AdjustmentRow {
  return {
    id: "MV-ID-2",
    movementNumber: "MV-20260915-000004",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    needleTypeId: "NT-1",
    reasonCode: "PHYSICAL_COUNT",
    reason: null,
    systemQuantity: 90,
    actualQuantity: 85,
    varianceQuantity: -5,
    countSessionId: "CS-1",
    evidenceCount: 0,
    createdBy: "USR-000",
    createdAt: "2026-09-15T09:00:00.000Z",
  };
}

/** Made before adjustment history existed: quantities were never recorded and must not be guessed. */
function legacyAdjustment(): AdjustmentRow {
  return {
    id: "MV-ID-3",
    movementNumber: "MV-20260901-000001",
    factoryId: "FAC-001",
    locationId: "LOC-1",
    needleTypeId: "NT-1",
    reasonCode: "OTHER",
    reason: null,
    systemQuantity: null,
    actualQuantity: null,
    varianceQuantity: -2,
    countSessionId: null,
    evidenceCount: 0,
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

interface MockOptions {
  grants?: string[];
  createFailure?: { status: number; code: string; message: string };
}

/** Every route this screen, its lookups and the ledger can reach, plus a catch-all that fails loudly for anything unmocked. */
async function mockAdjustmentApi(page: Page, opts: MockOptions = {}): Promise<World> {
  const grants = opts.grants ?? ["STOCK_VIEW", "STOCK_ADJUST"];
  const world: World = {
    requests: [],
    adjustments: [manualAdjustment(), countSessionAdjustment(), legacyAdjustment()],
    evidence: {
      "MV-ID-1": [
        {
          id: "EV-1",
          fileName: "count-sheet.jpg",
          mimeType: "image/jpeg",
          fileSize: 123456,
          url: EVIDENCE_URL,
          createdAt: "2026-09-15T07:50:00.000Z",
        },
      ],
    },
    balances: { "LOC-1:NT-1": 100 },
  };

  await page.route("https://evidence.test/**", (route: Route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: PNG_BYTES }),
  );

  await page.route("**/api/v1/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = request.method();

    world.requests.push({
      method,
      path,
      params: url.searchParams,
      body: jsonBody(route),
      raw: request.postData(),
      headers: request.headers(),
    });

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
      const rows = [LOCATION].filter((row) => !factoryId || row.factoryId === factoryId);
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

    if (path === "/inventory/adjustments/evidence" && method === "POST") {
      return route.fulfill({
        status: 201,
        json: envelope({
          id: "EV-9",
          fileName: "count-sheet.jpg",
          mimeType: "image/jpeg",
          fileSize: 11,
          createdAt: "2026-09-16T01:50:00.000Z",
        }),
      });
    }

    if (path === "/inventory/adjustments" && method === "GET") {
      const reasonCode = url.searchParams.get("reasonCode");
      const rows = world.adjustments.filter((row) => !reasonCode || row.reasonCode === reasonCode);
      return route.fulfill({ json: pagedEnvelope(rows) });
    }

    if (path === "/inventory/adjustments" && method === "POST") {
      if (opts.createFailure) {
        return route.fulfill({
          status: opts.createFailure.status,
          json: errorEnvelope(opts.createFailure.code, opts.createFailure.message),
        });
      }

      const body = request.postDataJSON() as CreateAdjustmentBody;
      const key = `${body.locationId}:${body.needleTypeId}`;
      const systemQuantity = world.balances[key] ?? 0;
      const created: AdjustmentRow = {
        id: "MV-ID-9",
        movementNumber: "MV-20260916-000020",
        factoryId: body.factoryId,
        locationId: body.locationId,
        needleTypeId: body.needleTypeId,
        reasonCode: body.reasonCode,
        reason: body.reason ?? null,
        systemQuantity,
        actualQuantity: body.actualQuantity,
        varianceQuantity: body.actualQuantity - systemQuantity,
        countSessionId: null,
        evidenceCount: body.evidenceIds.length,
        createdBy: "USR-000",
        createdAt: "2026-09-16T02:00:00.000Z",
      };
      world.balances[key] = body.actualQuantity;
      world.adjustments.unshift(created);

      return route.fulfill({
        status: 201,
        json: envelope({
          movementId: created.id,
          movementNumber: created.movementNumber,
          factoryId: created.factoryId,
          locationId: created.locationId,
          needleTypeId: created.needleTypeId,
          systemQuantity,
          actualQuantity: created.actualQuantity,
          varianceQuantity: created.varianceQuantity,
          reasonCode: created.reasonCode,
          reason: created.reason,
          evidenceIds: body.evidenceIds,
          countSessionId: null,
          createdAt: created.createdAt,
        }),
      });
    }

    if (path.startsWith("/inventory/adjustments/") && method === "GET") {
      const id = path.replace("/inventory/adjustments/", "");
      const row = world.adjustments.find((adjustment) => adjustment.id === id);
      if (!row) {
        return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `Adjustment not found: ${id}`) });
      }
      return route.fulfill({ json: envelope({ ...row, evidence: world.evidence[id] ?? [] }) });
    }

    return route.fulfill({ status: 404, json: errorEnvelope("NOT_FOUND", `unmocked: ${method} ${path}`) });
  });

  return world;
}

function historyRow(page: Page, movementNumber: string): Locator {
  return page.getByRole("button", { name: `View adjustment ${movementNumber}` });
}

function impact(dialog: Locator, label: string): Locator {
  return dialog.locator("dl > div").filter({ hasText: label }).locator("dd");
}

function listCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "GET" && request.path === "/inventory/adjustments");
}

function createCalls(world: World): Captured[] {
  return world.requests.filter((request) => request.method === "POST" && request.path === "/inventory/adjustments");
}

function uploadCalls(world: World): Captured[] {
  return world.requests.filter(
    (request) => request.method === "POST" && request.path === "/inventory/adjustments/evidence",
  );
}

async function openNewAdjustment(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "New Adjustment" }).click();
  const dialog = page.getByRole("dialog", { name: "New Adjustment" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Factory first: evidence belongs to a factory, and the upload control stays disabled until one is chosen. */
async function fillAdjustmentForm(page: Page, dialog: Locator, opts: { actualQuantity?: string } = {}): Promise<void> {
  await dialog.getByRole("combobox", { name: "Factory" }).click();
  await page.getByRole("option", { name: /Bandung Plant/ }).click();

  await dialog.getByRole("combobox", { name: "Location" }).click();
  await page.getByRole("option", { name: /Main Warehouse/ }).click();

  await dialog.getByRole("combobox", { name: "Needle Type" }).click();
  await page.getByRole("option", { name: /DBx1/ }).click();

  await dialog.getByLabel("Actual Quantity (physical count) *").fill(opts.actualQuantity ?? "95");
}

async function attachEvidence(dialog: Locator): Promise<void> {
  await dialog.getByLabel("Evidence *").setInputFiles({
    name: "count-sheet.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("photo-bytes"),
  });
  await expect(dialog.getByText("count-sheet.jpg")).toBeVisible();
}

async function chooseReasonCode(page: Page, dialog: Locator, label: string): Promise<void> {
  await dialog.getByRole("combobox", { name: "Reason Code" }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

test.describe("Inventory → Adjustment: history", () => {
  test("a manual adjustment row carries its reason code, quantities, signed variance, source and evidence count", async ({
    page,
  }) => {
    await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");

    await expect(page.getByRole("heading", { name: "Adjustment" })).toBeVisible();
    const row = historyRow(page, "MV-20260915-000003");
    await expect(row).toBeVisible();
    await expect(row).toContainText("Damaged");
    await expect(row).toContainText("100 → 95");
    await expect(row).toContainText("-5");
    await expect(row).toContainText("Manual");
    await expect(row).toContainText("WH-01 — Main Warehouse");
    await expect(row).toContainText("Test Admin");
  });

  test("an adjustment a count session wrote links back to that session, and a legacy one says its quantities were never recorded", async ({
    page,
  }) => {
    await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");

    const fromCount = historyRow(page, "MV-20260915-000004");
    await expect(fromCount).toContainText("Physical Count");
    await expect(fromCount.getByRole("link", { name: "Physical Count" })).toHaveAttribute("href", "/inventory/count/CS-1");

    await expect(historyRow(page, "MV-20260901-000001")).toContainText("Not recorded");
  });

  test("the Reason Code filter is sent to the server and resets to page 1", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();

    await page.getByRole("combobox", { name: "Filter by Reason Code" }).click();
    await page.getByRole("option", { name: "Physical Count", exact: true }).click();

    await expect.poll(() => listCalls(world).at(-1)?.params.get("reasonCode")).toBe("PHYSICAL_COUNT");
    expect(listCalls(world).at(-1)?.params.get("page")).toBe("1");
    await expect(historyRow(page, "MV-20260915-000003")).toHaveCount(0);
  });

  test("a row opens the detail its evidence belongs to, keyed by the ADJUSTMENT movement id", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await historyRow(page, "MV-20260915-000003").click();

    const detail = page.getByRole("dialog", { name: "Adjustment Detail" });
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Damaged");
    await expect(detail).toContainText("100 → 95");
    await expect(detail).toContainText("Bent in drawer");
    await expect(detail.getByText("Evidence (1)")).toBeVisible();
    await expect(detail.getByRole("link", { name: "Open count-sheet.jpg" })).toHaveAttribute("href", EVIDENCE_URL);
    await expect(detail.getByAltText("count-sheet.jpg")).toBeVisible();
    expect(world.requests.some((request) => request.path === "/inventory/adjustments/MV-ID-1")).toBe(true);
  });

  test("a count-session adjustment explains its missing evidence and offers the session instead", async ({ page }) => {
    await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment?id=MV-ID-2");

    const detail = page.getByRole("dialog", { name: "Adjustment Detail" });
    await expect(detail).toContainText("the session and its counted items are the evidence");
    await expect(detail.getByRole("link", { name: "Open count session" })).toHaveAttribute("href", "/inventory/count/CS-1");
  });

  test("the ledger's Reference drills through on the movement id the detail route takes, not the header id", async ({
    page,
  }) => {
    await mockAdjustmentApi(page);

    await page.goto("/inventory/movement");
    const reference = page.getByRole("table").getByRole("link", { name: "Adjustment" });
    await expect(reference).toHaveAttribute("href", "/inventory/adjustment?id=MV-ID-1");

    await reference.click();
    await page.waitForURL(/\/inventory\/adjustment\?id=MV-ID-1$/);

    await expect(page.getByRole("dialog", { name: "Adjustment Detail" })).toContainText("MV-20260915-000003");
  });
});

test.describe("Inventory → Adjustment: create", () => {
  test("refuses to submit without a reason code", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog);
    await attachEvidence(dialog);

    await dialog.getByRole("button", { name: "Review Adjustment" }).click();

    await expect(dialog.getByText("Reason code is required")).toBeVisible();
    expect(createCalls(world)).toHaveLength(0);
  });

  test("refuses to submit without at least one evidence file", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog);
    await chooseReasonCode(page, dialog, "Damaged");

    await dialog.getByRole("button", { name: "Review Adjustment" }).click();

    await expect(dialog.getByText("Upload at least one evidence file (photo or PDF)")).toBeVisible();
    expect(createCalls(world)).toHaveLength(0);
  });

  test("requires a note when the reason code is Other", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog);
    await attachEvidence(dialog);
    await chooseReasonCode(page, dialog, "Other");

    await dialog.getByRole("button", { name: "Review Adjustment" }).click();

    await expect(dialog.getByText("A note is required when the reason code is Other")).toBeVisible();
    expect(createCalls(world)).toHaveLength(0);
  });

  test("refuses a negative actual quantity", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog, { actualQuantity: "-5" });
    await attachEvidence(dialog);
    await chooseReasonCode(page, dialog, "Damaged");

    await dialog.getByRole("button", { name: "Review Adjustment" }).click();

    /**
     * Native `min={0}` intercepts the submit ahead of react-hook-form (the
     * form sets no `noValidate`), so zod's "Cannot be negative" never reaches
     * the DOM in a real browser. The contract's rule — an out-of-range actual
     * quantity cannot be submitted — still holds, and that is what this
     * asserts. See ticket 02's Comments for the design-system gap.
     */
    const actualQuantity = dialog.getByLabel("Actual Quantity (physical count) *");
    expect(await actualQuantity.evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
    await expect(page.getByText(/the balance updates now, with no approval step/)).toHaveCount(0);
    expect(createCalls(world)).toHaveLength(0);
  });

  test("a file the contract refuses never costs a round trip", async ({ page }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog);

    await dialog.getByLabel("Evidence *").setInputFiles({
      name: "script.sh",
      mimeType: "application/x-sh",
      buffer: Buffer.from("#!/bin/sh"),
    });

    await expect(dialog.getByText(/only JPEG, PNG or WebP photos and PDF files are accepted/)).toBeVisible();
    expect(uploadCalls(world)).toHaveLength(0);
  });

  test("uploads the evidence first, shows the variance it is about to apply, then submits only the returned ids", async ({
    page,
  }) => {
    const world = await mockAdjustmentApi(page);

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const listCallsBefore = listCalls(world).length;

    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog);
    await chooseReasonCode(page, dialog, "Damaged");
    await attachEvidence(dialog);

    // The file went to its own endpoint, for this factory, before the adjustment existed.
    expect(uploadCalls(world)).toHaveLength(1);
    const upload = uploadCalls(world)[0];
    expect(upload.raw).toContain('name="factoryId"');
    expect(upload.raw).toContain("FAC-001");
    expect(upload.raw).toContain("count-sheet.jpg");

    await dialog.getByRole("button", { name: "Review Adjustment" }).click();

    const confirm = page.getByRole("dialog", { name: "Confirm Stock Adjustment" });
    await expect(impact(confirm, "System Quantity")).toHaveText("100");
    await expect(impact(confirm, "Actual Quantity")).toHaveText("95");
    await expect(impact(confirm, "Variance")).toHaveText("-5");
    await expect(impact(confirm, "Reason Code")).toHaveText("Damaged");
    await expect(impact(confirm, "Evidence")).toHaveText("1 file(s)");
    await confirm.getByRole("button", { name: "Confirm Adjustment" }).click();

    await expect(page.getByText("Adjustment applied. Balance updated immediately.")).toBeVisible();

    const call = createCalls(world)[0];
    expect(call.body).toEqual({
      factoryId: "FAC-001",
      locationId: "LOC-1",
      needleTypeId: "NT-1",
      actualQuantity: 95,
      reasonCode: "DAMAGED",
      evidenceIds: ["EV-9"],
    });
    expect(call.headers["idempotency-key"]).toBeTruthy();

    // Applied immediately — no pending/approval state, and the history re-reads itself.
    await expect(page.getByText("Pending Confirmation")).toHaveCount(0);
    await expect(historyRow(page, "MV-20260916-000020")).toBeVisible();
    expect(listCalls(world).length).toBeGreaterThan(listCallsBefore);
  });

  test("surfaces a rejected evidence id inline rather than as a toast", async ({ page }) => {
    await mockAdjustmentApi(page, {
      createFailure: {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Every evidenceId must be a file you uploaded for this factory that no adjustment has used yet",
      },
    });

    await page.goto("/inventory/adjustment");
    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    const dialog = await openNewAdjustment(page);
    await fillAdjustmentForm(page, dialog);
    await chooseReasonCode(page, dialog, "Damaged");
    await attachEvidence(dialog);
    await dialog.getByRole("button", { name: "Review Adjustment" }).click();
    await page
      .getByRole("dialog", { name: "Confirm Stock Adjustment" })
      .getByRole("button", { name: "Confirm Adjustment" })
      .click();

    await expect(page.getByRole("alert")).toContainText("Every evidenceId must be a file you uploaded");
    await expect(historyRow(page, "MV-20260916-000020")).toHaveCount(0);
  });
});

test.describe("Inventory → Adjustment: permission gate", () => {
  test("a caller who may read the history but not adjust is offered no New Adjustment", async ({ page }) => {
    await mockAdjustmentApi(page, { grants: ["STOCK_VIEW"] });

    await page.goto("/inventory/adjustment");

    await expect(historyRow(page, "MV-20260915-000003")).toBeVisible();
    await expect(page.getByRole("button", { name: "New Adjustment" })).toHaveCount(0);
  });

  test("a caller without STOCK_VIEW sees access-denied, and the history is never requested", async ({ page }) => {
    const world = await mockAdjustmentApi(page, { grants: ["STOCK_ADJUST"] });

    await page.goto("/inventory/adjustment");

    await expect(page.getByText("You do not have access to this resource.")).toBeVisible();
    expect(listCalls(world)).toHaveLength(0);
  });
});
