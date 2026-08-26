"use client";

import { format } from "date-fns";
import { FileClock } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useAuditLogs } from "@/features/audit/api/queries";
import { DEFAULT_AUDIT_FILTERS } from "@/features/audit/api/types";
import { UserName } from "@/shared/components/user-name";

/**
 * `AUDIT_VIEW` (MANAGEMENT/SYSTEM_ADMIN only) is narrower than `EXCHANGE_VIEW`
 * — most users who can open this page can't see this section. Gated on the
 * real session's permissions before the request ever fires (same
 * `enabled`-gate pattern as `AuditLogScreen`), so an ordinary operator never
 * triggers an expected 403 here at all — it just renders nothing. Real
 * coverage is sparse regardless: only CREATE_EXCHANGE / ISSUE_NEEDLE /
 * CANCEL_EXCHANGE are ever audited for an exchange (see AuditLogEntry's doc
 * comment) — this is not the full 8-9 step timeline Docs 18 §13 mocks up.
 */
export function AuditTimeline({ exchangeId }: { exchangeId: string }) {
  const hasAuditView = usePermission(PERMISSIONS.AUDIT_VIEW);

  const { data, isLoading, isError, error, refetch } = useAuditLogs(
    {
      ...DEFAULT_AUDIT_FILTERS,
      entityType: "Exchange",
      entityId: exchangeId,
      pageSize: 50,
    },
    hasAuditView
  );

  if (!hasAuditView) {
    return null;
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={FileClock} title="No audited actions recorded for this exchange yet." />
        ) : (
          <ul className="space-y-3">
            {data.items.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <FileClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-slate-900">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm")}
                    {entry.actorUserId && (
                      <>
                        {" · "}
                        <UserName id={entry.actorUserId} />
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
