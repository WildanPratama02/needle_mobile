import { ALL_PERMISSIONS, PERMISSIONS, PermissionCode } from './permissions';

/**
 * The five roles from `Docs/11-Database-ERD-Physical-Schema.md` §39 and
 * `Docs/04-Functional-Requirements.md` FR-AUTH-002. Roles are seed data, not a
 * database enum — an admin can add more through the web app later — but these
 * five are the ones the rest of the system reasons about.
 */
export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  PIC_TROLI: 'PIC_TROLI',
  PIC_INVENTORY: 'PIC_INVENTORY',
  MANAGEMENT: 'MANAGEMENT',
  APPROVER: 'APPROVER',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

/**
 * Default role -> permission grants, derived from the per-role capability lists
 * in `Docs/03-Use-Case.md` §49. Seed data only: an admin may regrant at
 * runtime, and `RbacGuard` always reads the database, never this map.
 *
 * Note what is deliberately absent — PIC_TROLI runs exchanges but gets no
 * STOCK_TRANSFER or STOCK_ADJUST, and MANAGEMENT is read-only everywhere
 * (CONTEXT.md: Management does not decide Confirmations, that is APPROVER).
 */
export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  SYSTEM_ADMIN: ALL_PERMISSIONS,

  PIC_TROLI: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXCHANGE_VIEW,
    PERMISSIONS.EXCHANGE_CREATE,
    PERMISSIONS.EXCHANGE_ISSUE,
    PERMISSIONS.EXCHANGE_COMPLETE,
    PERMISSIONS.EXCHANGE_CANCEL,
    PERMISSIONS.CONFIRMATION_VIEW,
    PERMISSIONS.STOCK_VIEW,
  ],

  PIC_INVENTORY: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_RECEIVE,
    PERMISSIONS.STOCK_TRANSFER,
    PERMISSIONS.STOCK_RETURN,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_COUNT,
    PERMISSIONS.MASTER_VIEW,
  ],

  MANAGEMENT: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXCHANGE_VIEW,
    PERMISSIONS.CONFIRMATION_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.AUDIT_VIEW,
  ],

  APPROVER: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXCHANGE_VIEW,
    PERMISSIONS.CONFIRMATION_VIEW,
    PERMISSIONS.CONFIRMATION_APPROVE,
    PERMISSIONS.CONFIRMATION_REJECT,
  ],
};
