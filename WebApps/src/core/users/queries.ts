import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchAllUsers, fetchUsers } from "./data-source";
import type { UserListFilters, UserQuery, UserRow } from "./types";

/**
 * Same reasoning as `core/master-data/queries.ts`'s `REFERENCE_DATA_STALE_MS`
 * — a user directory changes far less often than it is read for name
 * resolution, and `.scratch/users-read-api/spec.md` story 17 wants the
 * directory loaded once per collection and reused across screens.
 */
const LOOKUP_STALE_MS = 30 * 60 * 1000;

export const userKeys = {
  all: ["users"] as const,
  lookup: (query: UserQuery) => [...userKeys.all, "lookup", query] as const,
  list: (filters: UserListFilters) => [...userKeys.all, "list", filters] as const,
};

/**
 * The whole directory the caller can see, cached — the one query every
 * id-to-name resolver in this app reads from (`shared/components/user-name.tsx`,
 * `user-select.tsx`).
 *
 * `enabled` is always the caller's own `USER_MANAGE` check
 * (`usePermission`), passed in before this ever fires — the lookup is
 * permission-gated before it fires, not fired-and-caught (spec's
 * Implementation Decisions).
 */
export function useUsersLookupData(query: UserQuery = {}, enabled = true) {
  return useQuery({
    queryKey: userKeys.lookup(query),
    queryFn: () => fetchAllUsers(query),
    staleTime: LOOKUP_STALE_MS,
    // USER_MANAGE is a permission a user either holds or does not — a 403 is
    // an authorization boundary, not a transient failure worth retrying.
    retry: false,
    enabled,
  });
}

export interface UserLookup {
  /** The row behind an id, or `undefined` when it is not in this collection or was never fetched. */
  get: (id: string | null | undefined) => UserRow | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Turns the cached directory into an id-to-row resolver — mirrors
 * `core/master-data/queries.ts`'s `useLookup`. The map is built once per
 * fetched directory rather than per lookup, so a long table costs one pass
 * over the directory instead of one scan per row.
 */
export function useUserLookup(query: UserQuery = {}, enabled = true): UserLookup {
  const { data, isLoading, isError } = useUsersLookupData(query, enabled);

  const byId = React.useMemo(() => {
    const map = new Map<string, UserRow>();
    for (const row of data ?? []) {
      map.set(row.id, row);
    }
    return map;
  }, [data]);

  return React.useMemo(
    () => ({
      get: (id) => (id ? byId.get(id) : undefined),
      isLoading,
      isError,
    }),
    [byId, isLoading, isError],
  );
}

/**
 * The one place a user id becomes something a person reads. An unresolved
 * row falls back to `fallback` — always the id itself. Same rule
 * `core/master-data/queries.ts`'s `displayLabel` establishes: never a blank,
 * never a dash, never a label the client invented.
 */
export function userDisplayLabel(row: UserRow | undefined, fallback: string): string {
  if (!row) return fallback;
  return row.name || row.username;
}

/**
 * Every user holding one role, via `GET /users?role=<code>`
 * (`.scratch/roles-permissions/spec.md`'s one new query param). Shares
 * `useUsersLookupData`'s cache namespace and fetch-all-pages behaviour — a
 * role's member list is a lookup, not a paginated screen of its own — so a
 * role and a plain factory-scoped lookup with the same query never collide
 * or duplicate a request. Disabled with no `role` given, same as any other
 * id-less query in this app.
 */
export function useUsersByRole(role: string | undefined, enabled = true) {
  return useUsersLookupData({ role }, enabled && Boolean(role));
}

/**
 * Real server pagination for the Administration → Users screen — distinct
 * from `useUsersLookupData`'s fetch-all-pages cache above; same
 * "USER_MANAGE is a boundary, not a retry" rule.
 */
export function useUsersList(filters: UserListFilters, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    retry: false,
    enabled,
  });
}
