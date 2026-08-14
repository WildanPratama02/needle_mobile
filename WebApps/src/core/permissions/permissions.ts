/**
 * The permission dimension of authorization, on the client.
 *
 * **Everything in this module is a UX guard, never a boundary.** The backend
 * rebuilds authorization from the database on every request and refuses
 * independently (`JwtAuthGuard` then `RbacGuard`). If this whole module were
 * deleted, the app would get uglier and no less safe. The opposite assumption
 * is the one that causes incidents, so it is written down here rather than
 * left to be inferred.
 */

/**
 * Mirrors `Backend/src/shared/constants/permissions.ts` — the exact strings
 * `RbacGuard` compares against.
 *
 * Typed so a mistyped code is a compile error. The predicates below still
 * accept a plain `string` at runtime, so a code added server-side before this
 * list catches up is matched normally rather than throwing.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: "DASHBOARD_VIEW",

  EXCHANGE_VIEW: "EXCHANGE_VIEW",
  EXCHANGE_CREATE: "EXCHANGE_CREATE",
  EXCHANGE_ISSUE: "EXCHANGE_ISSUE",
  EXCHANGE_COMPLETE: "EXCHANGE_COMPLETE",
  EXCHANGE_CANCEL: "EXCHANGE_CANCEL",

  CONFIRMATION_VIEW: "CONFIRMATION_VIEW",
  CONFIRMATION_APPROVE: "CONFIRMATION_APPROVE",
  CONFIRMATION_REJECT: "CONFIRMATION_REJECT",

  STOCK_VIEW: "STOCK_VIEW",
  STOCK_RECEIVE: "STOCK_RECEIVE",
  STOCK_TRANSFER: "STOCK_TRANSFER",
  STOCK_RETURN: "STOCK_RETURN",
  STOCK_ADJUST: "STOCK_ADJUST",
  STOCK_COUNT: "STOCK_COUNT",

  MASTER_VIEW: "MASTER_VIEW",
  MASTER_EDIT: "MASTER_EDIT",

  USER_MANAGE: "USER_MANAGE",
  DEVICE_MANAGE: "DEVICE_MANAGE",

  REPORT_VIEW: "REPORT_VIEW",
  REPORT_EXPORT: "REPORT_EXPORT",

  AUDIT_VIEW: "AUDIT_VIEW",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Anything carrying a permission list — `CurrentUser` satisfies this. */
export interface PermissionHolder {
  permissions: string[];
}

/**
 * Whether the holder has this exact permission.
 *
 * **Exact string equality, and nothing implies anything else.** `STOCK_VIEW`
 * grants no part of `STOCK_ADJUST`; holding every other code grants nothing
 * extra; there is no admin shortcut. `SYSTEM_ADMIN` can do everything only
 * because the seed grants it every code, not because any role is special. That
 * is the server's rule, and the client must not soften it — a hierarchy here
 * would disagree with the backend in the one direction that matters, offering
 * something the server then refuses.
 *
 * **Fails closed.** An absent holder — not yet loaded, or not authenticated —
 * holds nothing, so a gated control cannot flash into view while the session
 * is still resolving.
 */
export function hasPermission(
  holder: PermissionHolder | null | undefined,
  code: string,
): boolean {
  return holder?.permissions.includes(code) ?? false;
}

/** Every code, for a screen that needs more than one grant. */
export function hasAllPermissions(
  holder: PermissionHolder | null | undefined,
  codes: readonly string[],
): boolean {
  if (!holder) return false;
  return codes.every((code) => hasPermission(holder, code));
}

/** Any one code, for a menu entry reachable through more than one grant. */
export function hasAnyPermission(
  holder: PermissionHolder | null | undefined,
  codes: readonly string[],
): boolean {
  if (!holder) return false;
  return codes.some((code) => hasPermission(holder, code));
}
