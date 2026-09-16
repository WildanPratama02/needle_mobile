"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { HistoryFilterStore } from "../store";

const LABEL_CLASS = "mb-1 block text-xs font-medium text-slate-500";

/**
 * The filter row every history-first Inventory screen shares: location, needle
 * type, date range — plus `children` for a screen's own extra filter.
 * Locations follow TopBar's factory scope. Same controls and date-input
 * convention as the Stock Movement ledger's filters.
 */
export function HistoryFilters<E extends Record<string, string>>({
  store,
  idPrefix,
  showNeedleType = true,
  showDates = true,
  children,
}: {
  store: HistoryFilterStore<E>;
  idPrefix: string;
  showNeedleType?: boolean;
  showDates?: boolean;
  children?: ReactNode;
}) {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const locationId = store((s) => s.locationId);
  const needleTypeId = store((s) => s.needleTypeId);
  const dateFrom = store((s) => s.dateFrom);
  const dateTo = store((s) => s.dateTo);
  const setLocationId = store((s) => s.setLocationId);
  const setNeedleTypeId = store((s) => s.setNeedleTypeId);
  const setDateFrom = store((s) => s.setDateFrom);
  const setDateTo = store((s) => s.setDateTo);

  const factoryQuery = selectedFactoryId === "all" ? {} : { factoryId: selectedFactoryId };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className={LABEL_CLASS} htmlFor={`${idPrefix}-location`}>
          Location
        </label>
        <MasterDataSelect
          id={`${idPrefix}-location`}
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

      {showNeedleType && (
        <div>
          <label className={LABEL_CLASS} htmlFor={`${idPrefix}-needle-type`}>
            Needle Type
          </label>
          <MasterDataSelect
            id={`${idPrefix}-needle-type`}
            collection="needle-types"
            value={needleTypeId === "" ? "all" : needleTypeId}
            onChange={(value) => setNeedleTypeId(value === "all" ? "" : value)}
            ariaLabel="Filter by Needle Type"
            className="w-52"
            includeAllOption
            allLabel="All Needle Types"
          />
        </div>
      )}

      {children}

      {showDates && (
        <>
          <div>
            <label className={LABEL_CLASS} htmlFor={`${idPrefix}-date-from`}>
              Date From
            </label>
            <Input
              id={`${idPrefix}-date-from`}
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor={`${idPrefix}-date-to`}>
              Date To
            </label>
            <Input
              id={`${idPrefix}-date-to`}
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </>
      )}
    </div>
  );
}
