import { test, expect, type Page, type Route } from "@playwright/test";
import { authMeEnvelope, MOCK_SESSION_USER } from "./helpers/auth";

/**
 * One router-style handler covers every real endpoint the Detail page hits
 * (`/exchanges/:id`, `/exchanges/:id/evidence`, `/confirmations/:id`,
 * `/confirmations/:id/approve|reject`, `/audit-logs`) — branching on the
 * actual URL rather than juggling Playwright glob-pattern precedence across
 * several overlapping `**\/exchanges*`-style routes.
 */
function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true, data, meta: { requestId: "REQ-TEST", ...meta } };
}

const EXCHANGE = {
  id: "EX-1",
  exchangeNumber: "EXC-20260810-000001",
  status: "CONFIRMATION_PENDING",
  factoryId: "FAC-001",
  trolleyId: "TRL-001",
  deviceId: "DEV-001",
  operatorId: "EMP-001",
  exchangeTypeId: "TYPE-001",
  oldNeedleTypeId: "NDL-001",
  newNeedleTypeId: null,
  fragmentStatus: "NOT_FOUND",
  confirmationId: "CNF-1",
  createdAt: "2026-08-10T08:30:00.000Z",
  completedAt: null,
  cancelledAt: null,
};

function confirmation(status: string) {
  return {
    id: "CNF-1",
    confirmationNumber: "CNF-20260810-000001",
    exchangeId: "EX-1",
    exchangeNumber: "EXC-20260810-000001",
    exchangeStatus: "CONFIRMATION_PENDING",
    factoryId: "FAC-001",
    status,
    requestedToUserId: "USR-001",
    requestedAt: "2026-08-10T08:31:00.000Z",
    dueAt: "2026-08-10T09:31:00.000Z",
    decidedAt: status === "PENDING" ? null : "2026-08-10T08:40:00.000Z",
    decisions:
      status === "PENDING"
        ? []
        : [{ id: "DEC-1", decision: status, decidedBy: "USR-002", reason: null, decidedAt: "2026-08-10T08:40:00.000Z" }],
  };
}

const USERS = [
  { id: "USR-001", username: "budi.santoso", name: "Budi Santoso", status: "ACTIVE", roles: ["APPROVER"], factoryIds: ["FAC-001"] },
  { id: "USR-002", username: "siti.aminah", name: "Siti Aminah", status: "ACTIVE", roles: ["APPROVER"], factoryIds: ["FAC-001"] },
  { id: "USR-003", username: "wati.rahayu", name: "Wati Rahayu", status: "ACTIVE", roles: ["PIC_TROLI"], factoryIds: ["FAC-001"] },
];

async function mockExchangeDetailApi(
  page: Page,
  opts: { auditForbidden?: boolean; noAuditPermission?: boolean; noUserManage?: boolean } = {}
) {
  let confirmationStatus = "PENDING";

  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/auth/me" && method === "GET") {
      if (opts.noAuditPermission) {
        return route.fulfill({
          json: {
            success: true,
            data: { ...MOCK_SESSION_USER, permissions: MOCK_SESSION_USER.permissions.filter((p) => p !== "AUDIT_VIEW") },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }
      if (opts.noUserManage) {
        return route.fulfill({
          json: {
            success: true,
            data: { ...MOCK_SESSION_USER, permissions: MOCK_SESSION_USER.permissions.filter((p) => p !== "USER_MANAGE") },
            meta: { requestId: "REQ-TEST" },
          },
        });
      }
      return route.fulfill({ json: authMeEnvelope() });
    }
    if (path === "/users" && method === "GET") {
      return route.fulfill({ json: envelope(USERS, { page: 1, pageSize: 100, total: USERS.length, totalPages: 1 }) });
    }
    if (path === "/exchanges" && method === "GET") {
      return route.fulfill({ json: envelope([EXCHANGE], { page: 1, pageSize: 20, total: 1, totalPages: 1 }) });
    }
    if (path === "/exchanges/EX-1" && method === "GET") {
      return route.fulfill({ json: envelope(EXCHANGE) });
    }
    if (path === "/exchanges/EX-1/evidence" && method === "GET") {
      return route.fulfill({
        json: envelope([
          {
            id: "EVD-1",
            exchangeId: "EX-1",
            evidenceType: "OLD_NEEDLE",
            storageKey: "exchanges/2026/08/EX-1/EVD-1.jpg",
            status: "UPLOADED",
            fileName: "old-needle.jpg",
            mimeType: "image/jpeg",
            checksum: "abc123",
            capturedAt: "2026-08-10T08:32:00.000Z",
            uploadedAt: "2026-08-10T08:33:00.000Z",
            url: "https://minio.local/evidence/EVD-1.jpg?sig=xyz",
          },
        ]),
      });
    }
    if (path === "/confirmations/CNF-1" && method === "GET") {
      return route.fulfill({ json: envelope(confirmation(confirmationStatus)) });
    }
    if (path === "/confirmations/CNF-1/approve" && method === "POST") {
      confirmationStatus = "APPROVED";
      return route.fulfill({ json: envelope(confirmation("APPROVED")) });
    }
    if (path === "/confirmations/CNF-1/reject" && method === "POST") {
      confirmationStatus = "REJECTED";
      return route.fulfill({ json: envelope(confirmation("REJECTED")) });
    }
    if (path === "/audit-logs" && method === "GET") {
      if (opts.auditForbidden) {
        return route.fulfill({
          status: 403,
          json: { success: false, error: { code: "FORBIDDEN", message: "Missing AUDIT_VIEW", details: [] }, meta: { requestId: "REQ-TEST" } },
        });
      }
      return route.fulfill({
        json: envelope(
          [
            {
              id: "AUD-1",
              timestamp: "2026-08-10T08:30:00.000Z",
              action: "CREATE_EXCHANGE",
              entityType: "Exchange",
              entityId: "EX-1",
              actorUserId: "USR-003",
              actorDeviceId: null,
              factoryId: "FAC-001",
              requestId: "REQ-1",
              beforeData: null,
              afterData: null,
              metadata: null,
            },
          ],
          { total: 1 }
        ),
      });
    }

    return route.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "unmocked route", details: [] } } });
  });
}

test.describe("Exchange Detail", () => {
  test("clicking a row in Exchange Transactions navigates to and renders the detail page", async ({ page }) => {
    await mockExchangeDetailApi(page);

    await page.goto("/transactions/exchange");
    await page.getByText("EXC-20260810-000001").click();

    await expect(page).toHaveURL(/\/transactions\/exchange\/EX-1$/);
    await expect(page.getByRole("heading", { name: "EXC-20260810-000001" })).toBeVisible();
  });

  test("renders evidence, a pending confirmation with actions, and the audit trail", async ({ page }) => {
    await mockExchangeDetailApi(page);

    await page.goto("/transactions/exchange/EX-1");

    await expect(page.getByRole("heading", { name: "EXC-20260810-000001" })).toBeVisible();
    await expect(page.getByAltText("OLD_NEEDLE")).toBeVisible();
    await expect(page.getByText("CNF-20260810-000001")).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(page.getByText("Audit Trail")).toBeVisible();
    await expect(page.getByText("CREATE EXCHANGE")).toBeVisible();
  });

  test("resolves the Confirmation panel's Requested To and the Audit Trail's Actor to real names", async ({ page }) => {
    await mockExchangeDetailApi(page);

    await page.goto("/transactions/exchange/EX-1");

    await expect(page.getByText("Budi Santoso")).toBeVisible();
    await expect(page.getByText("Wati Rahayu")).toBeVisible();
    await expect(page.getByText("USR-001")).not.toBeVisible();
  });

  test("falls back to the raw user id and never requests the directory when the session lacks USER_MANAGE", async ({ page }) => {
    let usersRequested = false;
    await mockExchangeDetailApi(page, { noUserManage: true });
    page.on("request", (req) => {
      if (new URL(req.url()).pathname.replace(/^\/api\/v1/, "") === "/users") {
        usersRequested = true;
      }
    });

    await page.goto("/transactions/exchange/EX-1");

    await expect(page.getByRole("heading", { name: "EXC-20260810-000001" })).toBeVisible();
    await expect(page.getByText("USR-001")).toBeVisible();
    expect(usersRequested).toBe(false);
  });

  test("approving a confirmation calls the real endpoint and the actions disappear", async ({ page }) => {
    await mockExchangeDetailApi(page);

    await page.goto("/transactions/exchange/EX-1");
    await page.getByRole("button", { name: "Approve" }).click();
    await page.getByRole("button", { name: "Confirm Approval" }).click();

    await expect(page.getByRole("button", { name: "Approve" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).not.toBeVisible();
  });

  test("rejecting requires a reason, typed in the dialog, before it can be confirmed", async ({ page }) => {
    await mockExchangeDetailApi(page);

    await page.goto("/transactions/exchange/EX-1");
    await page.getByRole("button", { name: "Reject" }).click();

    const confirmButton = page.getByRole("button", { name: "Confirm Rejection" });
    await expect(confirmButton).toBeDisabled();

    await page.getByPlaceholder("Reason for rejection *").fill("Fragment not located");
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(page.getByRole("button", { name: "Approve" })).not.toBeVisible();
  });

  test("hides the Audit Trail section without ever requesting it when the session lacks AUDIT_VIEW", async ({ page }) => {
    await mockExchangeDetailApi(page, { noAuditPermission: true });

    let auditLogRequested = false;
    page.on("request", (req) => {
      if (new URL(req.url()).pathname.replace(/^\/api\/v1/, "") === "/audit-logs") {
        auditLogRequested = true;
      }
    });

    await page.goto("/transactions/exchange/EX-1");

    await expect(page.getByRole("heading", { name: "EXC-20260810-000001" })).toBeVisible();
    await expect(page.getByText("Audit Trail")).not.toBeVisible();
    expect(auditLogRequested).toBe(false);
  });

  test("shows an error if the Audit Trail request fails despite having AUDIT_VIEW", async ({ page }) => {
    await mockExchangeDetailApi(page, { auditForbidden: true });

    await page.goto("/transactions/exchange/EX-1");

    await expect(page.getByRole("heading", { name: "EXC-20260810-000001" })).toBeVisible();
    await expect(page.getByText("Audit Trail")).toBeVisible();
    await expect(page.getByText("Missing AUDIT_VIEW")).toBeVisible();
  });
});
