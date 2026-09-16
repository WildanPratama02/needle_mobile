"use client";

import { useLookup, type Location } from "@/core/master-data";
import { MasterDataName } from "@/shared/components/master-data-name";

export const LOCATION_TYPE_LABELS: Record<Location["locationType"], string> = {
  WAREHOUSE: "Warehouse",
  TROLLEY: "Trolley",
  USED_NEEDLE_STORAGE: "Used Needle Storage",
};

/**
 * A location's name with its type underneath, so a trolley is recognisable at
 * a glance in history tables. Reads the same cached `locations` collection
 * `MasterDataName` does — no extra request.
 */
export function LocationWithType({ id }: { id: string | null | undefined }) {
  const locations = useLookup("locations");
  const row = locations.get(id);

  return (
    <span className="inline-flex flex-col leading-tight">
      <MasterDataName collection="locations" id={id} withCode />
      {row && (
        <span className="text-xs text-slate-500">{LOCATION_TYPE_LABELS[row.locationType] ?? row.locationType}</span>
      )}
    </span>
  );
}
