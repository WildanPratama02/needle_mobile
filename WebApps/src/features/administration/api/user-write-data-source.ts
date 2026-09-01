import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { UserRow } from "@/core/users";
import type { CreateUserInput, UpdateUserInput } from "./user-write-types";

/**
 * The write half of `/users` — reads stay in `core/users`
 * (`fetchUsers`/`fetchAllUsers`/`fetchUser`), this only adds the six routes
 * that module never had. `Docs/12` §16 documents all six; ticket 06
 * confirms only `GET /users` and `GET /users/:id` exist in
 * `Backend/src/modules/identity/controllers/user.controller.ts` today —
 * the rest are backend work this WebApps-scope run does not perform (see
 * ticket status note).
 */

/** `POST /users` — `USER_MANAGE`, 201. 409 on a duplicate `username`. No credential response field, per `user-write-types.ts`'s header comment. */
export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const { data } = await apiClient.post<ApiSuccessBody<UserRow>>("/users", input);
  return data.data;
}

/** `PATCH /users/:id` — `USER_MANAGE`. `name`/`status` only; `username` is immutable. */
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRow> {
  const { data } = await apiClient.patch<ApiSuccessBody<UserRow>>(`/users/${id}`, input);
  return data.data;
}

/**
 * `POST /users/:id/roles` — `USER_MANAGE`. Role assignment is restricted to
 * the five seeded `ROLES` catalogue codes server-side (ticket 06
 * acceptance); this call sends whatever code the caller picked from
 * `core/roles`'s own catalogue, never a free-text value.
 */
export async function assignRole(userId: string, roleCode: string): Promise<UserRow> {
  const { data } = await apiClient.post<ApiSuccessBody<UserRow>>(`/users/${userId}/roles`, { roleCode });
  return data.data;
}

/** `DELETE /users/:id/roles/:roleId` — `USER_MANAGE`. */
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

/** `DELETE /users/:id/factory-scopes/:factoryId` — `USER_MANAGE`. */
export async function revokeFactoryScope(userId: string, factoryId: string): Promise<UserRow> {
  const { data } = await apiClient.delete<ApiSuccessBody<UserRow>>(`/users/${userId}/factory-scopes/${factoryId}`);
  return data.data;
}
