import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userKeys } from "@/core/users";
import {
  assignFactoryScope,
  assignRole,
  createUser,
  revokeFactoryScope,
  revokeRole,
  updateUser,
} from "./user-write-data-source";
import type { UpdateUserInput } from "./user-write-types";

/**
 * Invalidates only the `users` "list" key space (the Administration → Users
 * screen). Deliberately does **not** touch `userKeys.lookup` — that cache
 * backs `UserName`/`UserSelect` app-wide and is intentionally 30-minutes
 * stale; a write here shouldn't force every id-to-name resolver on screen to
 * refetch.
 */
function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [...userKeys.all, "list"] });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useAssignRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) => assignRole(userId, roleCode),
    onSuccess: () => invalidate(),
  });
}

export function useRevokeRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) => revokeRole(userId, roleCode),
    onSuccess: () => invalidate(),
  });
}

export function useAssignFactoryScope() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, factoryId }: { userId: string; factoryId: string }) => assignFactoryScope(userId, factoryId),
    onSuccess: () => invalidate(),
  });
}

export function useRevokeFactoryScope() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, factoryId }: { userId: string; factoryId: string }) => revokeFactoryScope(userId, factoryId),
    onSuccess: () => invalidate(),
  });
}
