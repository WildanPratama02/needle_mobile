import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { UserRow } from "@/core/users";
import type { CreateUserInput, UpdateUserInput } from "./user-write-types";

/**
 * The write half of `/users` — reads stay in `core/users`
 * (`fetchUsers`/`fetchAllUsers`/`fetchUser`), this only adds the six routes
 * that module never had. `Docs/12` §16 documents all six, and all six now
 * exist in `Backend/src/modules/identity/controllers/user.controller.ts`.
 */

/**
 * `POST /users` — `USER_MANAGE`, 201. Carries the admin-set first password
 * and at least one factory scope (see `user-write-types.ts`'s header).
 * 409 on a duplicate `username`; 403 if a `factoryIds` entry is outside the
 * caller's own scope. The response never echoes the password.
 */
export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const { data } = await apiClient.post<ApiSuccessBody<UserRow>>("/users", input);
  return data.data;
}

/** `PATCH /users/:id` — `USER_MANAGE`. `name`/`status` only; `username` is immutable. 400 when deactivating your own account. */
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRow> {
  const { data } = await apiClient.patch<ApiSuccessBody<UserRow>>(`/users/${id}`, input);
  return data.data;
}

/**
 * `POST /users/:id/roles` — `USER_MANAGE`. Role assignment is restricted to
 * the five seeded `ROLES` catalogue codes server-side (ticket 06
 * acceptance); this call sends whatever code the caller picked from
 * `core/roles`'s own catalogue, never a free-text value. 403 when the role
 * carries permissions the calling admin does not hold.
 */
export async function assignRole(userId: string, roleCode: string): Promise<UserRow> {
  const { data } = await apiClient.post<ApiSuccessBody<UserRow>>(`/users/${userId}/roles`, { roleCode });
  return data.data;
}

/** `DELETE /users/:id/roles/:roleCode` — `USER_MANAGE`. The role is addressed by code, not id. */
export async function revokeRole(userId: string, roleCode: string): Promise<UserRow> {
  const { data } = await apiClient.delete<ApiSuccessBody<UserRow>>(`/users/${userId}/roles/${roleCode}`);
  return data.data;
}

/**
 * `POST /users/:id/factory-scopes` — `USER_MANAGE`. Ticket 06 acceptance:
 * "intersects with the caller's own factory scope — an admin cannot grant a
 * user access to a factory the admin cannot themselves see" — enforced
 * server-side; the picker this feeds is already restricted client-side to
 * `useAuthorizedFactories()`, same never-widen-scope rule `FactorySelect`
 * already follows everywhere else.
 */
export async function assignFactoryScope(userId: string, factoryId: string): Promise<UserRow> {
  const { data } = await apiClient.post<ApiSuccessBody<UserRow>>(`/users/${userId}/factory-scopes`, { factoryId });
  return data.data;
}

/** `DELETE /users/:id/factory-scopes/:factoryId` — `USER_MANAGE`. 400 when it is the user's last factory scope. */
export async function revokeFactoryScope(userId: string, factoryId: string): Promise<UserRow> {
  const { data } = await apiClient.delete<ApiSuccessBody<UserRow>>(`/users/${userId}/factory-scopes/${factoryId}`);
  return data.data;
}
