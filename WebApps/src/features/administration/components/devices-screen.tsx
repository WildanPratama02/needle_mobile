"use client";

import * as React from "react";
import { Plus, Power, RotateCcw, ShieldOff } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { DataTable } from "@/shared/tables";
import { useDevices } from "../api/device-queries";
import type { Device } from "../api/device-types";
import { useDeviceFilters, useDeviceFilterStore } from "../store";
import { deviceColumns } from "./columns";
import { DeviceFilters } from "./device-filters";
import { DeviceReassignDialog } from "./device-reassign-dialog";
import { DeviceRegisterDialog } from "./device-register-dialog";
import { DeviceStatusDialog, type DeviceStatusAction } from "./device-status-dialog";

/**
 * Administration → Devices (Device story 28). `DEVICE_MANAGE` is the one
 * grant gating every device route, read and write alike (spec's
 * Implementation Decisions) — unlike Employee's `MASTER_VIEW`/`MASTER_EDIT`
 * split, there is no separate "can see but not act" tier here, so the whole
 * screen (list, Register, Activate/Revoke, Reassign) sits behind one
 * `RequirePermission`.
 *
 * `POST /devices/:id/heartbeat` has no button anywhere on this screen —
 * Device story 13, verified by `e2e/administration-devices.spec.ts`'s
 * "heartbeat is never called" assertion.
 */
export function DevicesScreen() {
  const filters = useDeviceFilters();
  const setPage = useDeviceFilterStore((s) => s.setPage);
  const hasDeviceManage = usePermission(PERMISSIONS.DEVICE_MANAGE);
  const { data, isPending, isError, error, refetch } = useDevices(filters, hasDeviceManage);

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<{ device: Device; action: DeviceStatusAction } | null>(
    null,
  );
  const [reassignTarget, setReassignTarget] = React.useState<Device | null>(null);

  const columns = React.useMemo<ColumnDef<Device, unknown>[]>(
    () => [
      ...deviceColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const device = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {device.status !== "ACTIVE" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusTarget({ device, action: "activate" })}
                >
                  <Power className="h-3.5 w-3.5" />
                  Activate
                </Button>
              )}
              {device.status !== "REVOKED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusTarget({ device, action: "revoke" })}
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setReassignTarget(device)}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reassign
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Devices"
        description="The tablet roster registered against your factories, within your scope."
        breadcrumb={[{ label: "Administration" }, { label: "Devices" }]}
        actions={
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            Register Device
          </Button>
        }
      />

      <RequirePermission permission={PERMISSIONS.DEVICE_MANAGE} isError={isError} error={error}>
        <div className="space-y-4">
          <DeviceFilters />

          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isPending}
            isError={isError}
            errorMessage={isError ? getApiErrorMessage(error) : undefined}
            onRetry={() => refetch()}
            emptyTitle="No devices found."
            emptyDescription="Try a different factory, trolley, or status filter."
            pageIndex={filters.page - 1}
            pageSize={filters.pageSize}
            pageCount={data?.totalPages ?? 0}
            totalRows={data?.total ?? 0}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          />
        </div>
      </RequirePermission>

      <DeviceRegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} />

      <DeviceStatusDialog
        action={statusTarget?.action ?? "activate"}
        device={statusTarget?.device ?? null}
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
      />

      <DeviceReassignDialog
        device={reassignTarget}
        open={reassignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReassignTarget(null);
        }}
      />
    </>
  );
}
