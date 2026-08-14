import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { AuditLogEntry, AuditLogFilters, PagedAuditLog } from "./types";

/**
 * `GET /audit-logs` — audit.controller.ts:47, `AUDIT_VIEW` only. Read-only:
 * this module never issues POST/PUT/PATCH/DELETE — audit rows are written
 * solely by `AuditLogInterceptor` server-side (audit.service.ts's own
 * doc comment), there is nothing here to mutate.
 *
 * The single seam every caller goes through, including Exchange Detail's
 * `AuditTimeline` (which just fixes `entityType`/`entityId` and leaves the
 * rest at their "omit" sentinel) — one implementation, not two.
 */
export async function fetchAuditLogs(filters: AuditLogFilters): Promise<PagedAuditLog> {
  const { data } = await apiClient.get<ApiSuccessBody<AuditLogEntry[]>>("/audit-logs", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      actorUserId: filters.actorUserId.trim() === "" ? undefined : filters.actorUserId.trim(),
      entityType: filters.entityType.trim() === "" ? undefined : filters.entityType.trim(),
      entityId: filters.entityId.trim() === "" ? undefined : filters.entityId.trim(),
      action: filters.action === "ALL" ? undefined : filters.action,
      dateFrom: filters.dateFrom === "" ? undefined : filters.dateFrom,
      dateTo: filters.dateTo === "" ? undefined : filters.dateTo,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });

  return {
    items: data.data,
    page: data.meta.page ?? filters.page,
    pageSize: data.meta.pageSize ?? filters.pageSize,
    total: data.meta.total ?? 0,
    totalPages: data.meta.totalPages ?? 0,
  };
}
