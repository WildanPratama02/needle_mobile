"use client";

import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useUserLookup, userDisplayLabel } from "@/core/users";

interface UserNameProps {
  id: string | null | undefined;
  /** Rendered when the reference itself is absent — a null actor (system-initiated), not a failed lookup. */
  emptyLabel?: string;
}

/**
 * Renders the name behind a user id — `requestedToUserId`, `decidedBy`,
 * `actorUserId` (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * The `USER_MANAGE` check lives here, once, rather than at each of its four
 * call sites: a viewer lacking it never issues the `/users` request and never
 * sees a 403 — they see the id, via the same fallback path an unresolved id
 * already takes. Mirrors `MasterDataName`, with the permission gate folded in
 * because this collection (unlike master data) isn't visible to everyone.
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
