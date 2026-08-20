import type { CurrentUser } from "@/core/auth/types";

/**
 * A SYSTEM_ADMIN-equivalent fixture (every permission this app currently
 * checks) for tests that render something behind `useCurrentUser` —
 * `ConfirmationPanel`'s Approve/Reject gate, `AuditLogScreen`'s `AUDIT_VIEW`
 * gate, `TopBar`'s factory list, and the five Inventory screens'
 * `STOCK_VIEW`/`STOCK_RECEIVE`/`STOCK_TRANSFER`/`STOCK_ADJUST` gates. Pair with mocking `@/core/auth/data-source`'s
 * `fetchCurrentUser` and setting `useSessionBootstrapStore`'s `ready: true`
 * (the real `SessionProvider` isn't mounted in a focused component test) —
 * that lets the real `useCurrentUser` hook run, same convention as every
 * other data-source mock in this codebase, rather than mocking the hook
 * itself.
 */
export const MOCK_CURRENT_USER: CurrentUser = {
  id: "USR-000",
  username: "admin",
  name: "Test Admin",
  roles: ["SYSTEM_ADMIN"],
  permissions: [
    "DASHBOARD_VIEW",
    "EXCHANGE_VIEW",
    "EXCHANGE_CREATE",
    "EXCHANGE_ISSUE",
    "EXCHANGE_COMPLETE",
    "EXCHANGE_CANCEL",
    "CONFIRMATION_VIEW",
    "CONFIRMATION_APPROVE",
    "CONFIRMATION_REJECT",
    "STOCK_VIEW",
    "STOCK_RECEIVE",
    "STOCK_TRANSFER",
    "STOCK_ADJUST",
    "AUDIT_VIEW",
  ],
  factoryIds: ["FAC-001", "FAC-002"],
  locationIds: [],
};
