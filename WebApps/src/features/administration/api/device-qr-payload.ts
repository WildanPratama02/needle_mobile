import type { Device } from "./device-types";

/**
 * The provisioning QR a trolley tablet scans once at first launch to learn
 * its own device id (gap MG-1 in
 * `Docs/architecture/backend-mobile-contract-matrix.md` — the exact format
 * is documented there, and the Flutter scanner builds against that text,
 * so change both together).
 *
 * The payload carries identifiers only, no secret: the tablet validates the
 * id by calling `GET /mobile/bootstrap` with it as `X-Device-ID`, and the
 * backend decides whether the device is usable. `deviceCode` is there so the
 * tablet can show the operator which device it just learned, never for
 * authorization.
 *
 * Key order is fixed by the object literal below, so the same device always
 * renders the same QR.
 */
export const DEVICE_QR_TYPE = "needle-device";
export const DEVICE_QR_VERSION = 1;

export interface DeviceQrPayload {
  type: typeof DEVICE_QR_TYPE;
  v: typeof DEVICE_QR_VERSION;
  /** `Device.id`, the UUID the tablet sends as `X-Device-ID`. */
  deviceId: string;
  /** `Device.deviceCode`, for display on the tablet only. */
  deviceCode: string;
}

export function buildDeviceQrPayload(device: Pick<Device, "id" | "deviceCode">): string {
  const payload: DeviceQrPayload = {
    type: DEVICE_QR_TYPE,
    v: DEVICE_QR_VERSION,
    deviceId: device.id,
    deviceCode: device.deviceCode,
  };
  return JSON.stringify(payload);
}
