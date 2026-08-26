import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'auditEvent';

/**
 * The critical actions that must leave an audit trail.
 *
 * `Backend/CLAUDE.md` §5 lists the project-wide set; these are the
 * exchange-side members of it. `CANCEL_EXCHANGE` is not in that list but is
 * required by `Docs/02` §22 ("VOID / REVERSAL dengan audit trail") and
 * `Docs/03` UC-MOB-014 step 5 — CLAUDE.md §5 states a minimum, not a ceiling,
 * so auditing it satisfies every source.
 *
 * `LOGIN` belongs to its own future ticket (issue 10 scope note) — `/auth/login`
 * still writes no audit row.
 *
 * `RECEIVE_STOCK`, `TRANSFER_STOCK` and `ADJUST_STOCK` are the Inventory
 * module's members (`.scratch/inventory/spec.md` decision #7 — `RECEIVE_STOCK`
 * is new; `TRANSFER_STOCK`/`ADJUST_STOCK` were already named in
 * `Backend/CLAUDE.md` §4 but unwired until this module).
 *
 * `CHANGE_MASTER` was likewise already named in `Backend/CLAUDE.md` §4 but
 * unwired until `.scratch/master-data-storage-rfid/spec.md` gave the
 * `master-data`/`employee`/`rfid` modules their first write endpoints.
 *
 * `DEVICE_BIND`/`DEVICE_REVOKE` were named in `Backend/CLAUDE.md` §4 from the
 * start but unwired until `.scratch/device-and-inventory/spec.md`'s
 * `DeviceModule` gave device lifecycle its first write endpoints —
 * `DEVICE_BIND` fires on register, activate and reassign (a device becoming,
 * or staying, bound to a trolley/factory pair); `DEVICE_REVOKE` on revoke.
 */
export const AUDIT_ACTIONS = {
  CREATE_EXCHANGE: 'CREATE_EXCHANGE',
  ISSUE_NEEDLE: 'ISSUE_NEEDLE',
  CANCEL_EXCHANGE: 'CANCEL_EXCHANGE',
  APPROVE_CONFIRMATION: 'APPROVE_CONFIRMATION',
  REJECT_CONFIRMATION: 'REJECT_CONFIRMATION',
  RECEIVE_STOCK: 'RECEIVE_STOCK',
  TRANSFER_STOCK: 'TRANSFER_STOCK',
  ADJUST_STOCK: 'ADJUST_STOCK',
  CHANGE_MASTER: 'CHANGE_MASTER',
  DEVICE_BIND: 'DEVICE_BIND',
  DEVICE_REVOKE: 'DEVICE_REVOKE',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEvent {
  action: AuditAction;
  /** Domain entity the action operated on, e.g. `Exchange`. */
  entityType: string;
}

/**
 * Marks a route as auditable. `AuditLogInterceptor` writes the row; services
 * never log manually (Backend/CLAUDE.md §5).
 */
export const Audit = (action: AuditAction, entityType: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType } satisfies AuditEvent);
