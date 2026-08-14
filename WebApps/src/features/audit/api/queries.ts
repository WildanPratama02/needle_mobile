import { useQuery } from "@tanstack/react-query";

import type { AuditLogFilters } from "./types";
import { fetchAuditLogs } from "./data-source";

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (filters: AuditLogFilters) => [...auditKeys.all, "list", filters] as const,
};

/**
 * `AUDIT_VIEW` is narrow (MANAGEMENT/SYSTEM_ADMIN only) — a 403 is an
 * expected authorization boundary, not a transient failure, so this doesn't
 * retry (same rule as the embedded Exchange Detail usage had).
 */
export function useAuditLogs(filters: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => fetchAuditLogs(filters),
    retry: false,
    enabled,
  });
}
