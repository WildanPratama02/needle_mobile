"use client";

import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useUserLookup, userDisplayLabel } from "@/core/users";

interface UserNameProps {
  id: string | null | undefined;
  /** Rendered when the reference itself is absent — a null field, not a failed lookup. */
  emptyLabel?: string;
}

/**
 * Renders the name behind a user id — `.scratch/users-read-api/spec.md`
 * (GAP-06), the frontend half of the name-resolution arc `core/master-data`
 * started for reference data. Used by `ConfirmationPanel` (`requestedToUserId`,
 * `decidedBy`), the Confirmation list's "Requested To" column, `AuditTimeline`
 * and the Audit Log's "Actor" column.
 *
 * **Permission-gated before the lookup ever fires, not fired-and-caught.**
 * `USER_MANAGE` is checked here and passed as the `enabled` flag into
 * `useUserLookup` — a viewer lacking it never issues the request and never
 * sees a 403 (spec's Implementation Decisions).
 *
 * **Unresolved falls back to the id, visibly — same rule as every other
 * lookup.** Whether the miss is "permission not held" or "id genuinely not
 * found", the rendering path is identical: the muted monospace treatment
 * `MasterDataName` already uses for an unresolved reference. Never a blank.
 */
export function UserName({ id, emptyLabel = "—" }: UserNameProps) {
  const hasUserManage = usePermission(PERMISSIONS.USER_MANAGE);
  const lookup = useUserLookup({}, hasUserManage);

  if (!id) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  const row = lookup.get(id);

  if (!row) {
    return (
      <span
        className="font-mono text-xs text-slate-500"
        title={hasUserManage && lookup.isLoading ? "Resolving…" : id}
      >
        {userDisplayLabel(undefined, id)}
      </span>
    );
  }

  return <span title={row.username}>{userDisplayLabel(row, id)}</span>;
}
