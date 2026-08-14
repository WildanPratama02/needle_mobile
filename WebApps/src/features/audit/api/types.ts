/**
 * Mirrors `Backend/src/modules/audit/dto/audit-response.dto.ts` and
 * `audit-query.dto.ts` exactly. Docs/12 §17's documented filter list matches
 * this DTO field-for-field — a rare case where the doc and the code agree
 * fully (unlike `GET /exchanges`).
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  actorDeviceId: string | null;
  factoryId: string | null;
  requestId: string | null;
  /** Always null in the real data — Backend/ARCHITECTURE.md's own note on `AuditLogResponseDto.beforeData`. Never render a "before" side as if it's populated. */
  beforeData: unknown;
  afterData: unknown;
  metadata: unknown;
}

/**
 * The 5 actions `AuditLogInterceptor` can ever write
 * (`common/decorators/audit.decorator.ts`) — an exhaustive, code-verified
 * list, not a guess. `entityType` has no equivalent closed set (it's a plain
 * string set per call site — today only "Exchange"/"Confirmation" are ever
 * written, but nothing enforces that staying true), so it's a free-text
 * filter instead of a Select.
 */
export const AUDIT_ACTIONS = [
  "CREATE_EXCHANGE",
  "ISSUE_NEEDLE",
  "CANCEL_EXCHANGE",
  "APPROVE_CONFIRMATION",
  "REJECT_CONFIRMATION",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Every param `AuditQueryDto` declares. Sentinels ("all" / "" / undefined) mean "omit this param" for every caller, including embedded ones like Exchange Detail's timeline. */
export interface AuditLogFilters {
  factoryId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: AuditAction | "ALL";
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

export interface PagedAuditLog {
  items: AuditLogEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** All params at their "omit" sentinel — callers spread this and override only what they need (e.g. Exchange Detail fixes `entityType`/`entityId`). */
export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  factoryId: "all",
  actorUserId: "",
  entityType: "",
  entityId: "",
  action: "ALL",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 20,
};
