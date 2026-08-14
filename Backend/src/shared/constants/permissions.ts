/**
 * Permission catalogue — the exact strings `RbacGuard` compares against.
 *
 * Source: `Docs/10-Database-Design.md` §permissions, which is the only place a
 * complete catalogue is enumerated (Docs/03 §49 lists per-role examples in the
 * opposite word order — `CREATE_EXCHANGE` rather than `EXCHANGE_CREATE`; see
 * `.scratch/exchange/issues/02-auth-identity-module.md` for why Docs/10 wins).
 *
 * Everything lives in this one file on purpose: permission codes are referenced
 * by the seed, by `@RequirePermissions()` decorators, and by tests, so a rename
 * has exactly one edit site.
 *
 * No permission ever implies another (Backend/CLAUDE.md §5) — a role holding
 * `STOCK_VIEW` gets no part of `STOCK_ADJUST`. Grants are explicit, always.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',

  EXCHANGE_VIEW: 'EXCHANGE_VIEW',
  EXCHANGE_CREATE: 'EXCHANGE_CREATE',
  // Authored fresh: Docs/03 §49 gives PIC_TROLI the capabilities ISSUE_NEEDLE
  // and COMPLETE_EXCHANGE, but Docs/10's catalogue has no code for either.
  // Ticket 05 needs both to gate its state transitions.
  EXCHANGE_ISSUE: 'EXCHANGE_ISSUE',
  EXCHANGE_COMPLETE: 'EXCHANGE_COMPLETE',
  EXCHANGE_CANCEL: 'EXCHANGE_CANCEL',

  CONFIRMATION_VIEW: 'CONFIRMATION_VIEW',
  CONFIRMATION_APPROVE: 'CONFIRMATION_APPROVE',
  CONFIRMATION_REJECT: 'CONFIRMATION_REJECT',

  STOCK_VIEW: 'STOCK_VIEW',
  STOCK_RECEIVE: 'STOCK_RECEIVE',
  STOCK_TRANSFER: 'STOCK_TRANSFER',
  STOCK_RETURN: 'STOCK_RETURN',
  STOCK_ADJUST: 'STOCK_ADJUST',
  STOCK_COUNT: 'STOCK_COUNT',

  MASTER_VIEW: 'MASTER_VIEW',
  MASTER_EDIT: 'MASTER_EDIT',

  USER_MANAGE: 'USER_MANAGE',
  DEVICE_MANAGE: 'DEVICE_MANAGE',

  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_EXPORT: 'REPORT_EXPORT',

  AUDIT_VIEW: 'AUDIT_VIEW',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);
