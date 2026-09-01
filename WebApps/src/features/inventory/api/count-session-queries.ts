import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryKeys } from "./queries";
import {
  addCountItem,
  completeCountSession,
  createCountSession,
  fetchCountSession,
} from "./count-session-data-source";
import type { AddCountItemInput } from "./count-session-types";

export const countSessionKeys = {
  all: ["count-sessions"] as const,
  detail: (id: string) => [...countSessionKeys.all, id] as const,
};

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
      queryClient.invalidateQueries({ queryKey: countSessionKeys.detail(session.id) });
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
 * `inventory` key space, same as every other write in this module.
 *
 * `result`'s shape is a best-effort guess (see `count-session-types.ts`'s
 * header comment), so `result.session` is read defensively rather than
 * assumed present — a shape mismatch here should not throw out of `onSuccess`.
 */
export function useCompleteCountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => completeCountSession(sessionId),
    onSuccess: (result) => {
      if (result?.session?.id) {
        queryClient.setQueryData(countSessionKeys.detail(result.session.id), result.session);
      }
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
