import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryKeys } from "./queries";
import {
  addCountItem,
  cancelCountSession,
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

/** `GET /inventory/count-sessions` — the Physical Count landing list. `enabled` carries the caller's `STOCK_COUNT` answer. */
export function useCountSessions(filters: CountSessionListFilters, enabled = true) {
  return useQuery({
    queryKey: countSessionKeys.list(filters),
    queryFn: () => fetchCountSessions(filters),
    retry: false,
    enabled,
  });
}

/** The session route (`/inventory/count/[id]`) reads the session from the server, so a refresh resumes it. */
export function useCountSession(id: string | null, enabled = true) {
  return useQuery({
    queryKey: countSessionKeys.detail(id ?? ""),
    queryFn: () => fetchCountSession(id as string),
    retry: false,
    enabled: enabled && id !== null,
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

/** The list's `itemCount` changes too. */
export function useAddCountItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: AddCountItemInput }) =>
      addCountItem(sessionId, input),
    onSuccess: (session) => {
      queryClient.setQueryData(countSessionKeys.detail(session.id), session);
      queryClient.invalidateQueries({ queryKey: countSessionKeys.lists() });
    },
  });
}

/**
 * Completing a session creates Adjustment movements — invalidates the whole
 * `inventory` key space (balances, ledger, adjustment history), the
 * count-session lists, and the detail itself so its `adjustments` are the
 * server's, not assumed.
 */
export function useCompleteCountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => completeCountSession(sessionId),
    onSuccess: (result) => {
      queryClient.setQueryData(countSessionKeys.detail(result.session.id), result.session);
      queryClient.invalidateQueries({ queryKey: countSessionKeys.detail(result.session.id) });
      queryClient.invalidateQueries({ queryKey: countSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/** Cancelling moves no stock — only the session and its lists change. */
export function useCancelCountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => cancelCountSession(sessionId),
    onSuccess: (session) => {
      queryClient.setQueryData(countSessionKeys.detail(session.id), session);
      queryClient.invalidateQueries({ queryKey: countSessionKeys.lists() });
    },
  });
}
