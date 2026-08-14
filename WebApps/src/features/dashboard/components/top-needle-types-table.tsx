"use client";

import { Syringe } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { useNeedleConsumption } from "../api/queries";
import { useDashboardFilters } from "../store";

const TOP_N = 5;

/**
 * Plain Table primitives, not the (not-yet-built) sortable/paginated
 * DataTable wrapper — a static top-5 list doesn't need either, and building
 * that wrapper is Exchange Transactions' problem, not this screen's.
 */
export function TopNeedleTypesTable() {
  const filters = useDashboardFilters();
  const { data, isLoading, isError, refetch } = useNeedleConsumption(filters);
  const topItems = [...(data ?? [])].sort((a, b) => b.consumption - a.consumption).slice(0, TOP_N);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Needle Types</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message="Could not load needle consumption." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: TOP_N }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : topItems.length === 0 ? (
          <EmptyState icon={Syringe} title="No consumption data yet." description="Try a different period." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Needle Type</TableHead>
                <TableHead className="text-right">Consumption</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.map((item) => (
                <TableRow key={item.needleTypeId}>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">{item.needleTypeCode}</span>{" "}
                    {item.needleTypeName}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">{item.consumption}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
