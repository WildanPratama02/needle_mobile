"use client";

import { useCurrentUser } from "@/core/auth/queries";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type PermissionCode,
} from "./permissions";

/**
 * The session-aware form of the predicates.
 *
 * Thin on purpose: every comparison lives in `permissions.ts`, so there is one
 * implementation of the rule and it can be tested without rendering anything.
 * These only supply the current session.
 *
 * All three fail closed while `GET /auth/me` is still in flight, because an
 * absent user holds nothing.
 */

/** Whether the signed-in user holds this permission. */
export function usePermission(code: PermissionCode): boolean {
  const { data: user } = useCurrentUser();
  return hasPermission(user, code);
}

/** Whether the signed-in user holds every one of these permissions. */
export function useAllPermissions(codes: readonly PermissionCode[]): boolean {
  const { data: user } = useCurrentUser();
  return hasAllPermissions(user, codes);
}

/** Whether the signed-in user holds at least one of these permissions. */
export function useAnyPermission(codes: readonly PermissionCode[]): boolean {
  const { data: user } = useCurrentUser();
  return hasAnyPermission(user, codes);
}
