"use client";

import * as React from "react";
import { Copy, Download, ShieldAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetailField, MonoValue } from "@/shared/components/detail-field";
import { MasterDataName } from "@/shared/components/master-data-name";
import { getStatusLabel, StatusBadge } from "@/shared/components/status-badge";
import { buildDeviceQrPayload } from "../api/device-qr-payload";
import type { Device } from "../api/device-types";
import { formatLastSeen } from "./columns";

const QR_SIZE = 256;
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * `navigator.clipboard` only exists in a secure context, and the WebApps is
 * reached over plain http on the factory LAN — so fall back to the legacy
 * `execCommand("copy")` rather than silently doing nothing there.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * A printable SVG: the QR plus the device code and id underneath, so a
 * printout taped to a trolley still says which device it belongs to.
 */
function downloadQrSvg(svg: SVGSVGElement, device: Device) {
  const qr = new XMLSerializer().serializeToString(svg);
  const height = QR_SIZE + 56;
  const composed =
    `<svg xmlns="${SVG_NS}" width="${QR_SIZE}" height="${height}" viewBox="0 0 ${QR_SIZE} ${height}">` +
    `<rect width="100%" height="100%" fill="#ffffff"/>` +
    qr +
    `<text x="${QR_SIZE / 2}" y="${QR_SIZE + 22}" text-anchor="middle" font-family="monospace" font-size="18" fill="#0f172a">${escapeXml(device.deviceCode)}</text>` +
    `<text x="${QR_SIZE / 2}" y="${QR_SIZE + 44}" text-anchor="middle" font-family="monospace" font-size="9" fill="#475569">${escapeXml(device.id)}</text>` +
    `</svg>`;
  const url = URL.createObjectURL(new Blob([composed], { type: "image/svg+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `device-${device.deviceCode}-qr.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ProvisioningQr({ device }: { device: Device }) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  async function onCopy() {
    const ok = await copyText(device.id);
    if (ok) {
      toast.success("Device UUID copied.");
    } else {
      toast.error("Could not copy. Select the UUID and copy it manually.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border border-slate-200 bg-white p-2">
        <QRCodeSVG
          ref={svgRef}
          value={buildDeviceQrPayload(device)}
          size={QR_SIZE}
          level="M"
          marginSize={4}
          xmlns={SVG_NS}
          role="img"
          aria-label={`Provisioning QR code for device ${device.deviceCode}`}
        />
      </div>
      <div className="text-center">
        <p className="font-mono text-lg font-semibold text-slate-900">{device.deviceCode}</p>
        <p className="select-all break-all font-mono text-xs text-slate-600" data-testid="device-uuid">
          {device.id}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" />
          Copy Device UUID
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (svgRef.current) downloadQrSvg(svgRef.current, device);
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download QR
        </Button>
      </div>
    </div>
  );
}

function ProvisioningUnavailable({ device }: { device: Device }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-warning-500 bg-warning-50 px-3 py-2 text-sm text-warning-700"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        No provisioning QR code while this device is {getStatusLabel(device.status)}. A tablet set up with it would be
        blocked at start-up. Activate the device first.
      </p>
    </div>
  );
}

/**
 * Docs/18 §36 device detail, plus the MG-1 provisioning QR code: the admin
 * shows or prints this next to the tablet, and the tablet scans it once at
 * first launch to learn the `X-Device-ID` it sends on every request.
 *
 * The QR is offered for ACTIVE devices only. `/mobile/bootstrap` rejects an
 * INACTIVE or REVOKED device with `DEVICE_INACTIVE`, so a QR for one would
 * only provision a tablet that is blocked straight away. The status shown
 * here is the backend's value from the list query. The dialog does not
 * work out its own.
 */
export function DeviceDetailDialog({
  device,
  open,
  onOpenChange,
}: {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device Detail</DialogTitle>
          <DialogDescription>
            {device ? `${device.deviceCode} · ${device.deviceName}` : "Device information and provisioning QR code."}
          </DialogDescription>
        </DialogHeader>

        {device && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4">
              <DetailField label="Device ID" value={<MonoValue>{device.deviceCode}</MonoValue>} />
              <DetailField label="Device Name" value={device.deviceName} />
              <DetailField label="Serial Number" value={<MonoValue>{device.serialNumber}</MonoValue>} />
              <DetailField label="Status" value={<StatusBadge status={device.status} />} />
              <DetailField
                label="Factory"
                value={<MasterDataName collection="factories" id={device.factoryId} withCode />}
              />
              <DetailField
                label="Trolley"
                value={<MasterDataName collection="trolleys" id={device.trolleyId} withCode />}
              />
              <DetailField
                label="App Version"
                value={device.appVersion ?? <span className="text-slate-400">—</span>}
              />
              <DetailField label="Last Seen" value={formatLastSeen(device.lastSeenAt)} />
            </dl>

            <section aria-labelledby="device-provisioning-heading" className="space-y-3 border-t border-slate-200 pt-4">
              <div>
                <h3 id="device-provisioning-heading" className="text-sm font-semibold text-slate-900">
                  Provisioning QR Code
                </h3>
                <p className="text-sm text-slate-600">
                  Scan this with the trolley tablet at first launch. It carries the device identifiers only.
                </p>
              </div>
              {device.status === "ACTIVE" ? (
                <ProvisioningQr device={device} />
              ) : (
                <ProvisioningUnavailable device={device} />
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
