"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusLabel } from "@/shared/components/status-badge";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { DEVICE_STATUSES, type DeviceStatus } from "../api/device-types";
import { useDeviceFilterStore } from "../store";

/**
 * Every control here maps to a real filter `fetchDevices` sends. Factory
 * scope is TopBar's job (Docs/18 §6) — not duplicated here, same as Audit.
 * The Trolley select is scoped to the active factory and resets whenever
 * that factory changes, matching `StorageMappingFormDialog`'s cascading
 * pattern.
 */
export function DeviceFilters() {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const trolleyId = useDeviceFilterStore((s) => s.trolleyId);
  const status = useDeviceFilterStore((s) => s.status);
  const setTrolleyId = useDeviceFilterStore((s) => s.setTrolleyId);
  const setStatus = useDeviceFilterStore((s) => s.setStatus);

  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      setTrolleyId("");
    }
  }, [factoryId, setTrolleyId]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="device-status">
          Status
        </label>
        <Select value={status} onValueChange={(value) => setStatus(value as DeviceStatus | "ALL")}>
          <SelectTrigger id="device-status" className="w-48" aria-label="Filter by Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {DEVICE_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {getStatusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="device-trolley">
          Trolley
        </label>
        <MasterDataSelect
          collection="trolleys"
          query={factoryId !== "all" ? { factoryId } : undefined}
          value={trolleyId === "" ? "all" : trolleyId}
          onChange={(value) => setTrolleyId(value === "all" ? "" : value)}
          ariaLabel="Filter by Trolley"
          includeAllOption
          allLabel="All Trolleys"
          className="w-56"
        />
      </div>
    </div>
  );
}
