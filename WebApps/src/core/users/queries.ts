import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchUsers, type UserQuery } from "./data-source";
import type { UserRow } from "./types";

/** Same freshness window as `core/master-data` — an account directory changes rarely and is read constantly. */
const USER_DIRECTORY_STALE_MS = 30 * 60 * 1000;

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserQuery) => [...userKeys.all, query] as const,
};

/**
 * The one hook that fetches the user directory; every resolver below reads
 * from it. `enabled` is the caller's own `USER_MANAGE` check — never fired
 * for a caller known to lack the permission (`.scratch/users-read-api/spec.md`).
 */
export function useUsers(query: UserQuery = {}, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => fetchUsers(query),
    staleTime: USER_DIRECTORY_STALE_MS,
    // USER_MANAGE is a permission a user either holds or does not — a 403 is
    // an authorization boundary, not a transient failure worth retrying.
    retry: false,
    enabled,
  });
}

export interface UserLookup {
  get: (id: string | null | undefined) => UserRow | undefined;
  isLoading: boolean;
  isError: boolean;
}

/** Turns the directory into an id-to-row resolver, same shape as `core/master-data`'s `useLookup`. */
export function useUserLookup(query: UserQuery = {}, enabled = true): UserLookup {
  const { data, isLoading, isError } = useUsers(query, enabled);

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
 * The one place a user id becomes something a person reads — same honesty
 * rule as `core/master-data`'s `displayLabel`: an unresolved row falls back to
 * the id the caller passes, never a blank or an invented name.
 */
export function userDisplayLabel(row: UserRow | undefined, fallback: string): string {
  if (!row) return fallback;
  if (row.name && row.name !== row.username) {
    return `${row.username} — ${row.name}`;
  }
  return row.name || row.username;
}
