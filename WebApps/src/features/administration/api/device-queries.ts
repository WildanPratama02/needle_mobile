import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateDevice,
  fetchDevices,
  registerDevice,
  reassignDevice,
  revokeDevice,
} from "./device-data-source";
import type { DeviceListFilters, ReassignDeviceInput } from "./device-types";

export const deviceKeys = {
  all: ["devices"] as const,
  list: (filters: DeviceListFilters) => [...deviceKeys.all, "list", filters] as const,
};

/**
 * `DEVICE_MANAGE` is a single grant, not a role hierarchy — a 403 is an
 * authorization boundary, not a transient failure, so this does not retry
 * (same rule `useAuditLogs`/`useMasterData` already apply).
 */
export function useDevices(filters: DeviceListFilters, enabled = true) {
  return useQuery({
    queryKey: deviceKeys.list(filters),
    queryFn: () => fetchDevices(filters),
    retry: false,
    enabled,
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
}

export function useActivateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => activateDevice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => revokeDevice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
}

export function useReassignDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReassignDeviceInput }) => reassignDevice(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
}
