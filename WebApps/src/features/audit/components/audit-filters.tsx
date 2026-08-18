"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useUsers, userDisplayLabel } from "@/core/users";
import { AUDIT_ACTIONS, type AuditAction } from "../api/types";
import { useAuditFilterStore } from "../store";

const DEBOUNCE_MS = 400;

function useDebouncedInput(committed: string, commit: (value: string) => void) {
  const [draft, setDraft] = React.useState(committed);

  React.useEffect(() => {
    const timeout = setTimeout(() => commit(draft), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return [draft, setDraft] as const;
}

/**
 * Every control here maps to a real `AuditQueryDto` param. Factory scope is
 * TopBar's job (Docs/18 §6) — not duplicated here. "Entity Type" is free
 * text, not a Select: the field is a plain string per audit call site, not a
 * closed enum (see `AuditAction` for why Action, unlike Entity Type, *can*
 * be a Select).
 *
 * The Actor filter is a Select of real users for a caller holding
 * `USER_MANAGE` — `AuditQueryDto.actorUserId` is `@IsUUID()`, so free text was
 * a control that 400s on the only input a person would type
 * (`.scratch/users-read-api/spec.md`, mirroring GAP-02's trolley-filter fix).
 * A caller lacking `USER_MANAGE` keeps the free-text box: losing the ability
 * to filter by actor is worse than an imperfect control.
 */
export function AuditFilters() {
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const { data: users } = useUsers({}, hasUserManage);

  const actorUserId = useAuditFilterStore((s) => s.actorUserId);
  const entityType = useAuditFilterStore((s) => s.entityType);
  const entityId = useAuditFilterStore((s) => s.entityId);
  const action = useAuditFilterStore((s) => s.action);
  const dateFrom = useAuditFilterStore((s) => s.dateFrom);
  const dateTo = useAuditFilterStore((s) => s.dateTo);
  const setActorUserId = useAuditFilterStore((s) => s.setActorUserId);
  const setEntityType = useAuditFilterStore((s) => s.setEntityType);
  const setEntityId = useAuditFilterStore((s) => s.setEntityId);
  const setAction = useAuditFilterStore((s) => s.setAction);
  const setDateFrom = useAuditFilterStore((s) => s.setDateFrom);
  const setDateTo = useAuditFilterStore((s) => s.setDateTo);

  const [actorDraft, setActorDraft] = useDebouncedInput(actorUserId, setActorUserId);
  const [entityTypeDraft, setEntityTypeDraft] = useDebouncedInput(entityType, setEntityType);
  const [entityIdDraft, setEntityIdDraft] = useDebouncedInput(entityId, setEntityId);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="audit-action">
          Action
        </label>
        <Select value={action} onValueChange={(value) => setAction(value as AuditAction | "ALL")}>
          <SelectTrigger id="audit-action" className="w-56" aria-label="Filter by Action">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            {AUDIT_ACTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="audit-entity-type">
          Entity Type
        </label>
        <Input
          id="audit-entity-type"
          value={entityTypeDraft}
          onChange={(e) => setEntityTypeDraft(e.target.value)}
          placeholder="e.g. Exchange"
          className="w-36"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="audit-entity-id">
          Entity ID
        </label>
        <Input
          id="audit-entity-id"
          value={entityIdDraft}
          onChange={(e) => setEntityIdDraft(e.target.value)}
          placeholder="Entity ID"
          className="w-44"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="audit-actor">
          Actor
        </label>
        {hasUserManage ? (
          <Select
            value={actorUserId || "ALL"}
            onValueChange={(value) => setActorUserId(value === "ALL" ? "" : value)}
          >
            <SelectTrigger id="audit-actor" className="w-48" aria-label="Filter by Actor">
              <SelectValue placeholder="All Actors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actors</SelectItem>
              {(users ?? []).map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {userDisplayLabel(user, user.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="audit-actor"
            value={actorDraft}
            onChange={(e) => setActorDraft(e.target.value)}
            placeholder="Actor User ID"
            className="w-44"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="audit-date-from">
          Date From
        </label>
        <Input
          id="audit-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="audit-date-to">
          Date To
        </label>
        <Input
          id="audit-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </div>
    </div>
  );
}
