import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type {
  Device,
  DeviceListFilters,
  PagedDevices,
  ReassignDeviceInput,
  RegisterDeviceInput,
} from "./device-types";

/**
 * The single seam for every `/devices` call — `device-queries.ts` and the
 * Devices screen go through here, nothing calls `apiClient` directly.
 * `DEVICE_MANAGE` gates all six routes, read and write alike (spec's
 * Implementation Decisions) — a 403 here means the same thing on every call,
 * not a per-route distinction the client needs to reason about.
 */

export async function fetchDevices(filters: DeviceListFilters): Promise<PagedDevices> {
  const { data } = await apiClient.get<ApiSuccessBody<Device[]>>("/devices", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      trolleyId: filters.trolleyId === "" ? undefined : filters.trolleyId,
      status: filters.status === "ALL" ? undefined : filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });

  return {
    items: data.data,
    page: data.meta.page ?? filters.page,
    pageSize: data.meta.pageSize ?? filters.pageSize,
    total: data.meta.total ?? 0,
    totalPages: data.meta.totalPages ?? 0,
  };
}

/** `GET /devices/:id` — used by dialogs that need the current row's own factory/trolley (Reassign's prefill), not by the list. */
export async function fetchDevice(id: string): Promise<Device> {
  const { data } = await apiClient.get<ApiSuccessBody<Device>>(`/devices/${id}`);
  return data.data;
}

/** `POST /devices` — 201. Writes `DEVICE_BIND`. 400 when `trolleyId` does not belong to `factoryId`; 409 on a duplicate `deviceCode`/`serialNumber`. */
export async function registerDevice(input: RegisterDeviceInput): Promise<Device> {
  const { data } = await apiClient.post<ApiSuccessBody<Device>>("/devices", input);
  return data.data;
}

/** `POST /devices/:id/activate` — no required body. Writes `DEVICE_BIND` (registration, reactivation and reassignment all fire the same action, per spec). */
export async function activateDevice(id: string, reason?: string): Promise<Device> {
  const { data } = await apiClient.post<ApiSuccessBody<Device>>(`/devices/${id}/activate`, {
    reason: reason && reason.trim() !== "" ? reason.trim() : undefined,
  });
  return data.data;
}

/** `POST /devices/:id/revoke` — no required body. Writes `DEVICE_REVOKE`. */
export async function revokeDevice(id: string, reason?: string): Promise<Device> {
  const { data } = await apiClient.post<ApiSuccessBody<Device>>(`/devices/${id}/revoke`, {
    reason: reason && reason.trim() !== "" ? reason.trim() : undefined,
  });
  return data.data;
}

/** `POST /devices/:id/reassign` — `{ factoryId, trolleyId }`, same 400 as registration on a mismatched pair. Writes `DEVICE_BIND` with a before/after diff, no new audit action. */
export async function reassignDevice(id: string, input: ReassignDeviceInput): Promise<Device> {
  const { data } = await apiClient.post<ApiSuccessBody<Device>>(`/devices/${id}/reassign`, input);
  return data.data;
}
