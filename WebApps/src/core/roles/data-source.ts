import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { PermissionRow, RoleRow } from "./types";

/**
 * The single seam for every `/roles` and `/permissions` read — `queries.ts`
 * and the Administration → Roles & Permissions screen go through here,
 * nothing calls `apiClient` for a role or permission directly.
 *
 * Real endpoints, verified in source: `Backend/src/modules/identity`
 * registers `GET /roles` and `GET /permissions`
 * (`Backend/src/modules/identity/controllers/role.controller.ts`), both
 * requiring `USER_MANAGE` (`.scratch/roles-permissions/spec.md`). Neither
 * paginates — five roles and a fixed permission catalogue are small,
 * in-memory lists — so, unlike `core/users`, there is no page-loop here.
 */

/** `GET /roles` — the five seeded roles, each with its permission grants and caller-scoped member count. */
export async function fetchRoles(): Promise<RoleRow[]> {
  const { data } = await apiClient.get<ApiSuccessBody<RoleRow[]>>("/roles");
  return data.data;
}

/** `GET /permissions` — every permission code the system enforces, for the catalogue reference (spec story 3). */
export async function fetchPermissions(): Promise<PermissionRow[]> {
  const { data } = await apiClient.get<ApiSuccessBody<PermissionRow[]>>("/permissions");
  return data.data;
}
