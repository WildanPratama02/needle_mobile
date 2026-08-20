"use client";

import { Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useStockOverviewFilterStore } from "../store";

/**
 * Factory scope is TopBar's job (Docs/18 §6) — not duplicated here, same
 * convention `ExchangeFilters`/`AuditFilters` already follow. Location and
 * Trolley are mutually exclusive in this UI (the store clears one when the
 * other is set) because `ListBalancesQueryDto` 400s if both are given and
 * disagree — a Location row of `locationType: TROLLEY` and its matching
 * Trolley row resolve to the identical `inventory_balances.location_id`
 * either way (ADR-003), so nothing is lost by picking one.
 */
export function StockOverviewFilters({ onViewTrolley }: { onViewTrolley: (trolleyId: string) => void }) {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const locationId = useStockOverviewFilterStore((s) => s.locationId);
  const trolleyId = useStockOverviewFilterStore((s) => s.trolleyId);
  const needleTypeId = useStockOverviewFilterStore((s) => s.needleTypeId);
  const lowStock = useStockOverviewFilterStore((s) => s.lowStock);
  const setLocationId = useStockOverviewFilterStore((s) => s.setLocationId);
  const setTrolleyId = useStockOverviewFilterStore((s) => s.setTrolleyId);
  const setNeedleTypeId = useStockOverviewFilterStore((s) => s.setNeedleTypeId);
  const setLowStock = useStockOverviewFilterStore((s) => s.setLowStock);

  const factoryQuery = selectedFactoryId === "all" ? {} : { factoryId: selectedFactoryId };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Location</label>
        <MasterDataSelect
          collection="locations"
          query={factoryQuery}
          value={locationId === "" ? "all" : locationId}
          onChange={(value) => setLocationId(value === "all" ? "" : value)}
          ariaLabel="Filter by Location"
          className="w-56"
          includeAllOption
          allLabel="All Locations"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Trolley</label>
        <MasterDataSelect
          collection="trolleys"
          query={factoryQuery}
          value={trolleyId === "" ? "all" : trolleyId}
          onChange={(value) => setTrolleyId(value === "all" ? "" : value)}
          ariaLabel="Filter by Trolley"
          className="w-56"
          includeAllOption
          allLabel="All Trolleys"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Needle Type</label>
        <MasterDataSelect
          collection="needle-types"
          value={needleTypeId === "" ? "all" : needleTypeId}
          onChange={(value) => setNeedleTypeId(value === "all" ? "" : value)}
          ariaLabel="Filter by Needle Type"
          className="w-56"
          includeAllOption
          allLabel="All Needle Types"
        />
      </div>

      <Button
        type="button"
        variant={lowStock ? "default" : "secondary"}
        onClick={() => setLowStock(!lowStock)}
        aria-pressed={lowStock}
      >
        Low Stock Only
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={trolleyId === ""}
        onClick={() => onViewTrolley(trolleyId)}
      >
        <Boxes className="h-4 w-4" />
        View Trolley Detail
      </Button>
    </div>
  );
}
