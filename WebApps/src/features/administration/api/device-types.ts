/**
 * Mirrors `Backend/prisma/schema.prisma`'s `Device` model
 * (`id`/`deviceCode`/`deviceName`/`serialNumber`/`factoryId`/`trolleyId`/
 * `status`/`appVersion`/`lastSeenAt`) and the six routes
 * `.scratch/device-and-inventory/spec.md`'s Implementation Decisions section
 * names for `DeviceModule`: `GET /devices`, `GET /devices/:id`,
 * `POST /devices`, `POST /devices/:id/activate`, `POST /devices/:id/reassign`,
 * `POST /devices/:id/revoke`. `POST /devices/:id/heartbeat` is deliberately
 * absent from this module — it is the one route this spec keeps out of every
 * WebApps surface (Device story 13).
 *
 * `DeviceModule` did not exist in `Backend/src/modules/device/` at the time
 * this feature was built (`.gitkeep` only) — these types describe the
 * contract the spec commits the backend to, not a response captured from a
 * running route. Reconcile against the real DTOs once `DeviceModule` ships.
 */

export type DeviceStatus = "ACTIVE" | "INACTIVE" | "REVOKED";

export const DEVICE_STATUSES: DeviceStatus[] = ["ACTIVE", "INACTIVE", "REVOKED"];

/** `DeviceResponseDto`, expected shape. */
export interface Device {
  id: string;
  deviceCode: string;
  deviceName: string;
  serialNumber: string;
  factoryId: string;
  trolleyId: string;
  status: DeviceStatus;
  appVersion: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Only the params a `DeviceQueryDto` following this codebase's established
 * shape would declare — `factoryId`/`trolleyId`/`status`, plus paging. The
 * spec's "no separate DEVICE_VIEW" note means every field here is filtered
 * server-side against the same `DEVICE_MANAGE`-scoped factory/location set
 * the caller already carries; a factory/trolley outside that scope returns
 * an empty page, not another site's rows (Device story 27 pattern).
 */
export interface DeviceListFilters {
  /** "all" = omit — sourced from TopBar's global factory-scope selector, same convention as Audit. */
  factoryId: string;
  /** "" = omit. */
  trolleyId: string;
  status: DeviceStatus | "ALL";
  page: number;
  pageSize: number;
}

export interface PagedDevices {
  items: Device[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * `CreateDeviceDto`. The backend validates `trolleyId` belongs to
 * `factoryId`, rejecting with 400 otherwise (Device story 7) — the cascading
 * Factory-then-Trolley select in `DeviceRegisterDialog` only guides toward a
 * valid pair, it is not the boundary.
 */
export interface RegisterDeviceInput {
  deviceCode: string;
  deviceName: string;
  serialNumber: string;
  factoryId: string;
  trolleyId: string;
}

/**
 * `ReassignDeviceDto`, exactly as spec.md's Implementation Decisions section
 * states it: `{ factoryId, trolleyId }`, the identical trolley-belongs-to-
 * factory validation as registration (Device story 11).
 */
export interface ReassignDeviceInput {
  factoryId: string;
  trolleyId: string;
}

/** All params at their "omit" sentinel. */
export const DEFAULT_DEVICE_FILTERS: DeviceListFilters = {
  factoryId: "all",
  trolleyId: "",
  status: "ALL",
  page: 1,
  pageSize: 20,
};
