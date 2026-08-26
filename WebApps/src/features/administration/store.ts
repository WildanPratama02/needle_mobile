import * as React from "react";
import { create } from "zustand";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { DEFAULT_USER_LIST_FILTERS, type UserListFilters } from "@/core/users";
import { DEFAULT_DEVICE_FILTERS, type DeviceListFilters, type DeviceStatus } from "./api/device-types";

/**
 * Ephemeral UI filter state local to the Devices screen. Factory scope is
 * global-header state (Docs/18 §6), read from
 * `core/permissions/factory-scope-store` — not duplicated here, the same
 * rule every other module follows (Audit, Exchange, Master Data).
 */
interface DeviceFilterState {
  trolleyId: string;
  status: DeviceStatus | "ALL";
  page: number;
  pageSize: number;
  setTrolleyId: (value: string) => void;
  setStatus: (value: DeviceStatus | "ALL") => void;
  setPage: (page: number) => void;
}

export const useDeviceFilterStore = create<DeviceFilterState>((set) => ({
  trolleyId: DEFAULT_DEVICE_FILTERS.trolleyId,
  status: DEFAULT_DEVICE_FILTERS.status,
  page: DEFAULT_DEVICE_FILTERS.page,
  pageSize: DEFAULT_DEVICE_FILTERS.pageSize,
  setTrolleyId: (trolleyId) => set({ trolleyId }),
  setStatus: (status) => set({ status }),
  setPage: (page) => set({ page }),
}));

/** Resets to page 1 whenever a filter changes — a stale page number for a new filter set may not exist. */
export function useDeviceFilters(): DeviceListFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const trolleyId = useDeviceFilterStore((s) => s.trolleyId);
  const status = useDeviceFilterStore((s) => s.status);
  const page = useDeviceFilterStore((s) => s.page);
  const pageSize = useDeviceFilterStore((s) => s.pageSize);
  const setPage = useDeviceFilterStore((s) => s.setPage);

  const filterSignature = `${factoryId}|${trolleyId}|${status}`;
  const previousSignature = React.useRef(filterSignature);

  React.useEffect(() => {
    if (previousSignature.current !== filterSignature) {
      previousSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature, setPage]);

  return { factoryId, trolleyId, status, page, pageSize };
}

/**
 * Ephemeral UI filter state local to the Administration → Users screen
 * (`.scratch/users-read-api/spec.md`, GAP-06). Same shape as
 * `useDeviceFilterStore` — factory scope is global-header state, read from
 * `core/permissions/factory-scope-store`, not duplicated here. No
 * status/role filter: this spec's `GET /users` accepts only `factoryId` plus
 * paging (no `role=`, no search — see the spec's Implementation Decisions).
 */
interface UserFilterState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
}

export const useUserFilterStore = create<UserFilterState>((set) => ({
  page: DEFAULT_USER_LIST_FILTERS.page,
  pageSize: DEFAULT_USER_LIST_FILTERS.pageSize,
  setPage: (page) => set({ page }),
}));

/** Resets to page 1 whenever the factory scope changes — a stale page number for a new scope may not exist. */
export function useUserFilters(): UserListFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const page = useUserFilterStore((s) => s.page);
  const pageSize = useUserFilterStore((s) => s.pageSize);
  const setPage = useUserFilterStore((s) => s.setPage);

  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      setPage(1);
    }
  }, [factoryId, setPage]);

  return { factoryId, page, pageSize };
}
