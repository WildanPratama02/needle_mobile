"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { TrendingUp } from "lucide-react";

import { ChartCard } from "@/shared/components/chart-card";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useExchangeTrend } from "../api/queries";
import { useDashboardFilters } from "../store";

const chartConfig = {
  total: { label: "Total Exchange", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

/** Docs/18 §41 — single volume line, matching the spec's ASCII mockup (not a per-type breakdown). */
export function ExchangeTrendChart() {
  const filters = useDashboardFilters();
  const { data, isLoading, isError, refetch } = useExchangeTrend(filters);

  return (
    <ChartCard title="Exchange Trend">
      {isError ? (
        <ErrorState message="Could not load the exchange trend." onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No exchange data yet."
          description="Try a different factory or period."
        />
      ) : (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="exchangeTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.12} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(parseISO(value), "MM/dd")}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <ChartTooltip content={<ChartTooltipContent labelKey="date" />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#exchangeTrendFill)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
