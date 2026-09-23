/** Exchange steps a tablet may queue offline (Docs/12 §19). Evidence is not one of them. */
export const SYNC_COMMAND_TYPES = [
  'CREATE_EXCHANGE',
  'ASSIGN_OPERATOR',
  'SELECT_EXCHANGE_TYPE',
  'FRAGMENT_VALIDATION',
  'SELECT_NEW_NEEDLE',
  'ISSUE_NEEDLE',
  'STORE_USED_NEEDLE',
  'COMPLETE_EXCHANGE',
  'CANCEL_EXCHANGE',
] as const;

export type SyncCommandType = (typeof SYNC_COMMAND_TYPES)[number];

/**
 * - `SUCCESS` / `IDEMPOTENT_SUCCESS` — accepted (now, or on an earlier try).
 * - `REJECTED` — a business rule said no; nothing changed; not retried
 *   automatically (Docs/15 §14).
 * - `FAILED` — a technical failure (server error, a concurrent identical
 *   command); safe to retry as is.
 * - `SKIPPED` — an earlier command of the same exchange in this batch did
 *   not succeed, so this one was not attempted.
 */
export const SYNC_RESULT_STATUSES = [
  'SUCCESS',
  'IDEMPOTENT_SUCCESS',
  'REJECTED',
  'FAILED',
  'SKIPPED',
] as const;

export type SyncResultStatus = (typeof SYNC_RESULT_STATUSES)[number];

/** Docs/12 §19: at most this many commands per sync request. */
export const MAX_SYNC_COMMANDS = 50;

/** At most this many changed exchanges per pull; `hasMore` asks for another. */
export const MAX_PULL_CHANGES = 200;

/**
 * A pull only reports changes older than this. A transaction can stamp
 * `updated_at` and commit a moment later; without the lag a pull running in
 * between would advance the cursor past a row it could not yet see, and the
 * tablet would never receive it.
 */
export const PULL_SETTLE_MS = 2000;
