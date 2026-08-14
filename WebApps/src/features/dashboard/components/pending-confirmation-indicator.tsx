"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/shared/components/status-badge";
import { useDashboardOverview } from "../api/queries";
import { useDashboardFilters } from "../store";

/**
 * Small badge next to the KPI row (Q2) — not a full KpiCard, and not a link:
 * the Dashboard stays display-only for v1 (Q6), so this is a status signal
 * only, not a navigation affordance yet.
 */
export function PendingConfirmationIndicator() {
  const filters = useDashboardFilters();
  const { data, isLoading, isError } = useDashboardOverview(filters);

  if (isError) return null;
  if (isLoading) return <Skeleton className="h-6 w-40 rounded-full" />;

  return (
    <StatusBadge
      status="PENDING_CONFIRMATION"
      label={`${data?.pendingConfirmations ?? 0} Pending Confirmation${data?.pendingConfirmations === 1 ? "" : "s"}`}
    />
  );
}
