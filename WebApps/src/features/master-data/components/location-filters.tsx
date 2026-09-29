"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { getStatusLabel } from "@/shared/components/status-badge";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS, type LocationType } from "../api/location-types";

const LABEL_CLASS = "mb-1 block text-xs font-medium text-slate-500";

export interface LocationFilterValues {
  /** "all" = every factory the caller is scoped to. */
  factoryId: string;
  /** "all" = every type. Sent to the endpoint as `locationType` — see `LocationScreen`. */
  locationType: LocationType | "all";
  status: "ACTIVE" | "INACTIVE" | "all";
}

/**
 * Factory, type and status, the three filters ticket 01 asks for. All three
 * are `GET /locations` parameters, so each one re-asks the server rather than
 * narrowing rows already on screen.
 *
 * The factory options come from the `factories` collection already narrowed by
 * TopBar's factory scope (Docs/18 §6), so this control can only ever narrow
 * within that scope, never widen past it — picking "All Factories" here means
 * "everything the TopBar scope already allows", not "everything".
 */
export function LocationFilters({
  value,
  onChange,
}: {
  value: LocationFilterValues;
  onChange: (next: LocationFilterValues) => void;
}) {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className={LABEL_CLASS} htmlFor="location-factory">
          Factory
        </label>
        <MasterDataSelect
          id="location-factory"
          collection="factories"
          query={selectedFactoryId === "all" ? undefined : { factoryId: selectedFactoryId }}
          value={value.factoryId}
          onChange={(factoryId) => onChange({ ...value, factoryId })}
          ariaLabel="Filter by Factory"
          className="w-56"
          includeAllOption
          allLabel="All Factories"
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="location-type">
          Type
        </label>
        <Select
          value={value.locationType}
          onValueChange={(next) => onChange({ ...value, locationType: next as LocationFilterValues["locationType"] })}
        >
          <SelectTrigger id="location-type" className="w-52" aria-label="Filter by Type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LOCATION_TYPES.map((locationType) => (
              <SelectItem key={locationType} value={locationType}>
                {LOCATION_TYPE_LABELS[locationType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="location-status">
          Status
        </label>
        <Select
          value={value.status}
          onValueChange={(next) => onChange({ ...value, status: next as LocationFilterValues["status"] })}
        >
          <SelectTrigger id="location-status" className="w-44" aria-label="Filter by Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">{getStatusLabel("ACTIVE")}</SelectItem>
            <SelectItem value="INACTIVE">{getStatusLabel("INACTIVE")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
