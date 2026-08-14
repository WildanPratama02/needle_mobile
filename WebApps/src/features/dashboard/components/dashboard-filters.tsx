"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dashboardKeys } from "../api/queries";
import { PERIOD_LABEL, useDashboardFilterStore, type DashboardPeriod } from "../store";

/** Factory scope lives in TopBar (Docs/18 §6, global) — this is Period + Refresh only. */
export function DashboardFilters() {
  const period = useDashboardFilterStore((s) => s.period);
  const lastUpdatedAt = useDashboardFilterStore((s) => s.lastUpdatedAt);
  const setPeriod = useDashboardFilterStore((s) => s.setPeriod);
  const markRefreshed = useDashboardFilterStore((s) => s.markRefreshed);

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stamp "Last Updated" the first time data lands, without requiring the
  // user to hit Refresh first — Docs/18 §68 requires the timestamp always.
  useEffect(() => {
    if (lastUpdatedAt === null) markRefreshed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    markRefreshed();
    setIsRefreshing(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PERIOD_LABEL) as DashboardPeriod[]).map((key) => (
            <SelectItem key={key} value={key}>
              {PERIOD_LABEL[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
        <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Refresh
      </Button>

      <span className="text-xs text-slate-400">
        {lastUpdatedAt ? `Last Updated: ${format(lastUpdatedAt, "HH:mm")}` : "Last Updated: —"}
      </span>
    </div>
  );
}
