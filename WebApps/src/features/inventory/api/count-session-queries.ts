import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryKeys } from "./queries";
import {
  addCountItem,
  completeCountSession,
  createCountSession,
  fetchCountSession,
  fetchCountSessions,
} from "./count-session-data-source";
import type { AddCountItemInput, CountSessionListFilters } from "./count-session-types";

export const countSessionKeys = {
  all: ["count-sessions"] as const,
  lists: () => [...countSessionKeys.all, "list"] as const,
  list: (filters: CountSessionListFilters) => [...countSessionKeys.lists(), filters] as const,
  detail: (id: string) => [...countSessionKeys.all, id] as const,
};

/** `GET /inventory/count-sessions`. No screen consumes this yet (not in ticket 05's scope). */
export function useCountSessions(filters: CountSessionListFilters, enabled = true) {
  return useQuery({
    queryKey: countSessionKeys.list(filters),
    queryFn: () => fetchCountSessions(filters),
    enabled,
  });
}

export function useCountSession(id: string | null) {
  return useQuery({
    queryKey: countSessionKeys.detail(id ?? ""),
    queryFn: () => fetchCountSession(id as string),
    enabled: id !== null,
  });
}

export function useCreateCountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCountSession,
    onSuccess: (session) => {
      queryClient.setQueryData(countSessionKeys.detail(session.id), session);
      queryClient.invalidateQueries({ queryKey: countSessionKeys.lists() });
    },
  });
}

export function useAddCountItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: AddCountItemInput }) =>
      addCountItem(sessionId, input),
    onSuccess: (session) => {
      queryClient.setQueryData(countSessionKeys.detail(session.id), session);
    },
  });
}

/**
 * Completing a session creates Adjustment movements — invalidates the whole
 * `inventory` key space, same as every other write in this module, and the
 * count-session lists (the session's status changed).
 */
export function useCompleteCountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => completeCountSession(sessionId),
    onSuccess: (result) => {
      queryClient.setQueryData(countSessionKeys.detail(result.session.id), result.session);
      queryClient.invalidateQueries({ queryKey: countSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
