"use client";

import { PageHeader } from "@/shared/components/page-header";
import { DashboardFilters } from "./dashboard-filters";
import { PendingConfirmationIndicator } from "./pending-confirmation-indicator";
import { KpiRow } from "./kpi-row";
import { ExchangeTrendChart } from "./exchange-trend-chart";
import { TopNeedleTypesTable } from "./top-needle-types-table";
import { StockAlertPanel } from "./stock-alert-panel";

/** Layout order matches the Docs/18 §8 ASCII mockup exactly. */
export function DashboardScreen() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational overview across exchanges, needle consumption, and stock."
        breadcrumb={[{ label: "Dashboard" }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <DashboardFilters />
        <PendingConfirmationIndicator />
      </div>

      <div className="space-y-6">
        <KpiRow />
        <ExchangeTrendChart />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopNeedleTypesTable />
          <StockAlertPanel />
        </div>
      </div>
    </>
  );
}
