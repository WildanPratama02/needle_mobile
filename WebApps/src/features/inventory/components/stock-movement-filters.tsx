"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS, type MovementType } from "../api/types";
import { useStockMovementFilterStore } from "../store";

/** Same mutual-exclusion rule as Stock Overview's filters — see that file's comment. Date range mirrors Audit Log's own `type="date"` inputs. */
export function StockMovementFilters() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const locationId = useStockMovementFilterStore((s) => s.locationId);
  const trolleyId = useStockMovementFilterStore((s) => s.trolleyId);
  const needleTypeId = useStockMovementFilterStore((s) => s.needleTypeId);
  const movementType = useStockMovementFilterStore((s) => s.movementType);
  const dateFrom = useStockMovementFilterStore((s) => s.dateFrom);
  const dateTo = useStockMovementFilterStore((s) => s.dateTo);
  const setLocationId = useStockMovementFilterStore((s) => s.setLocationId);
  const setTrolleyId = useStockMovementFilterStore((s) => s.setTrolleyId);
  const setNeedleTypeId = useStockMovementFilterStore((s) => s.setNeedleTypeId);
  const setMovementType = useStockMovementFilterStore((s) => s.setMovementType);
  const setDateFrom = useStockMovementFilterStore((s) => s.setDateFrom);
  const setDateTo = useStockMovementFilterStore((s) => s.setDateTo);

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
          className="w-52"
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
          className="w-52"
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
          className="w-52"
          includeAllOption
          allLabel="All Needle Types"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="movement-type">
          Movement Type
        </label>
        <Select value={movementType} onValueChange={(value) => setMovementType(value as MovementType | "ALL")}>
          <SelectTrigger id="movement-type" className="w-52" aria-label="Filter by Movement Type">
            <SelectValue placeholder="Movement Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Movement Types</SelectItem>
            {MOVEMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {MOVEMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="movement-date-from">
          Date From
        </label>
        <Input
          id="movement-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="movement-date-to">
          Date To
        </label>
        <Input
          id="movement-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </div>
    </div>
  );
}
