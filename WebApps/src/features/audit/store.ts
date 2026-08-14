import * as React from "react";
import { create } from "zustand";

import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { DEFAULT_AUDIT_FILTERS, type AuditAction, type AuditLogFilters } from "./api/types";

/**
 * Ephemeral UI filter state local to this screen. Factory scope is
 * global-header state (Docs/18 §6), read from
 * core/permissions/factory-scope-store — not duplicated here, same rule as
 * every other module.
 */
interface AuditFilterState {
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: AuditAction | "ALL";
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  setActorUserId: (value: string) => void;
  setEntityType: (value: string) => void;
  setEntityId: (value: string) => void;
  setAction: (value: AuditAction | "ALL") => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setPage: (page: number) => void;
}

export const useAuditFilterStore = create<AuditFilterState>((set) => ({
  actorUserId: DEFAULT_AUDIT_FILTERS.actorUserId,
  entityType: DEFAULT_AUDIT_FILTERS.entityType,
  entityId: DEFAULT_AUDIT_FILTERS.entityId,
  action: DEFAULT_AUDIT_FILTERS.action,
  dateFrom: DEFAULT_AUDIT_FILTERS.dateFrom,
  dateTo: DEFAULT_AUDIT_FILTERS.dateTo,
  page: DEFAULT_AUDIT_FILTERS.page,
  pageSize: DEFAULT_AUDIT_FILTERS.pageSize,
  setActorUserId: (actorUserId) => set({ actorUserId }),
  setEntityType: (entityType) => set({ entityType }),
  setEntityId: (entityId) => set({ entityId }),
  setAction: (action) => set({ action }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  setPage: (page) => set({ page }),
}));

/** Resets to page 1 whenever any filter changes — a stale page number for a new filter set may not exist. */
export function useAuditFilters(): AuditLogFilters {
  const factoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const actorUserId = useAuditFilterStore((s) => s.actorUserId);
  const entityType = useAuditFilterStore((s) => s.entityType);
  const entityId = useAuditFilterStore((s) => s.entityId);
  const action = useAuditFilterStore((s) => s.action);
  const dateFrom = useAuditFilterStore((s) => s.dateFrom);
  const dateTo = useAuditFilterStore((s) => s.dateTo);
  const page = useAuditFilterStore((s) => s.page);
  const pageSize = useAuditFilterStore((s) => s.pageSize);
  const setPage = useAuditFilterStore((s) => s.setPage);

  const filterSignature = `${factoryId}|${actorUserId}|${entityType}|${entityId}|${action}|${dateFrom}|${dateTo}`;
  const previousSignature = React.useRef(filterSignature);

  React.useEffect(() => {
    if (previousSignature.current !== filterSignature) {
      previousSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature, setPage]);

  return { factoryId, actorUserId, entityType, entityId, action, dateFrom, dateTo, page, pageSize };
}
