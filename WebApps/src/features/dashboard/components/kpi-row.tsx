"use client";

import { ArrowLeftRight, XCircle, TriangleAlert, RefreshCw } from "lucide-react";

import { KpiCard } from "@/shared/components/kpi-card";
import { ErrorState } from "@/shared/components/error-state";
import { useDashboardOverview } from "../api/queries";
import { useDashboardFilters } from "../store";

/** Docs 18 §8 mockup — 4 cards only (Q2). Pending Confirmation/stock live elsewhere. */
export function KpiRow() {
  const filters = useDashboardFilters();
  const { data, isLoading, isError, refetch } = useDashboardOverview(filters);

  if (isError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ErrorState message="Could not load dashboard KPIs." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Total Exchange" value={data?.totalExchanges ?? 0} icon={ArrowLeftRight} isLoading={isLoading} />
      <KpiCard label="Broken Needle" value={data?.brokenNeedles ?? 0} icon={XCircle} isLoading={isLoading} />
      <KpiCard label="Bent Needle" value={data?.bentNeedles ?? 0} icon={TriangleAlert} isLoading={isLoading} />
      <KpiCard label="Changeover" value={data?.changeovers ?? 0} icon={RefreshCw} isLoading={isLoading} />
    </div>
  );
}
