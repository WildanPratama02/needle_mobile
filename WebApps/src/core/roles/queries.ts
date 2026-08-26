import { useQuery } from "@tanstack/react-query";

import { fetchPermissions, fetchRoles } from "./data-source";
import type { RoleRow } from "./types";

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
};

/**
 * The five-row role catalogue. Every consumer — the list screen and the
 * detail screen alike — reads from this one cached query; there is no
 * `GET /roles/:code` to call for a single row (spec's Implementation
 * Decisions: two routes only).
 *
 * `retry: false` matches every other `USER_MANAGE`-gated read in this app —
 * a 403 is an authorization boundary, not a transient failure.
 */
export function useRoles(enabled = true) {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: fetchRoles,
    retry: false,
    enabled,
  });
}

/** The full permission catalogue (spec story 3) — a reference independent of any one role's grant. */
export function usePermissionCatalogue(enabled = true) {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: fetchPermissions,
    retry: false,
    enabled,
  });
}

/**
 * One role by code, read out of the same cached list `useRoles` populates —
 * not a second request. `data` is `undefined` both while loading and when
 * the code does not match any seeded role; the caller tells those apart via
 * `isPending`/`isError`, same as any other query result.
 */
export function useRole(code: string | undefined, enabled = true) {
  const query = useRoles(enabled);
  const role: RoleRow | undefined = query.data?.find((row) => row.code === code);
  return { ...query, data: role };
}
