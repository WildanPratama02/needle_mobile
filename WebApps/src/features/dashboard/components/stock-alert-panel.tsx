"use client";

import { PackageCheck } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { StatusBadge } from "@/shared/components/status-badge";
import { useStockSummary } from "../api/queries";
import { useDashboardFilters } from "../store";

/** Docs/design.md §11.2 — list + StatusBadge, never folded into the chart palette. */
export function StockAlertPanel() {
  const filters = useDashboardFilters();
  const { data, isLoading, isError, refetch } = useStockSummary(filters);
  const items = [...(data?.outOfStockItems ?? []), ...(data?.lowStockItems ?? [])];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Alert</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message="Could not load stock alerts." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={PackageCheck} title="No stock alerts." description="All tracked stock is within range." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">
                    <span className="font-mono text-xs text-slate-500">{item.needleTypeCode}</span>{" "}
                    {item.needleTypeName}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {item.factoryName} · {item.locationName} · {item.balance}/{item.minimumStock}
                  </p>
                </div>
                <StatusBadge status={item.status} className="shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
