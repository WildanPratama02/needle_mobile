import { describe, expect, it } from "vitest";

import { buildDeviceQrPayload } from "./device-qr-payload";

const DEVICE = { id: "3f2b8c1e-9a4d-4e6b-8f0a-1c2d3e4f5a6b", deviceCode: "DEV-001" };

describe("buildDeviceQrPayload", () => {
  it("encodes exactly the MG-1 contract: type, version, device id and device code", () => {
    expect(JSON.parse(buildDeviceQrPayload(DEVICE))).toEqual({
      type: "needle-device",
      v: 1,
      deviceId: DEVICE.id,
      deviceCode: DEVICE.deviceCode,
    });
  });

  it("is a compact JSON string with a fixed key order, so the same device always renders the same QR", () => {
    expect(buildDeviceQrPayload(DEVICE)).toBe(
      '{"type":"needle-device","v":1,"deviceId":"3f2b8c1e-9a4d-4e6b-8f0a-1c2d3e4f5a6b","deviceCode":"DEV-001"}',
    );
  });

  it("carries identifiers only, nothing else from the device row", () => {
    const payload = JSON.parse(
      buildDeviceQrPayload({ ...DEVICE, serialNumber: "SN-1", factoryId: "FAC-1" } as typeof DEVICE),
    );
    expect(Object.keys(payload)).toEqual(["type", "v", "deviceId", "deviceCode"]);
  });

  it("escapes a device code with JSON-special characters instead of breaking the payload", () => {
    const payload = JSON.parse(buildDeviceQrPayload({ id: DEVICE.id, deviceCode: 'DEV "A"\\1' }));
    expect(payload.deviceCode).toBe('DEV "A"\\1');
  });
});
