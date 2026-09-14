/**
 * Users' write shapes (ticket 06,
 * `.scratch/admin-panel-crud/issues/06-administration-users-write-crud.md`).
 * Reads already fit `core/users`'s `UserRow` shape — only the request DTOs
 * are new. Mirrors `Backend/src/modules/identity/dto/user-request.dto.ts`
 * (`CreateUserDto`/`UpdateUserDto`), which is the confirmed contract.
 *
 * **First credential — decided:** the admin sets the new account's first
 * password at create (the user's decision on ticket 06's open question,
 * over invite-link or forced reset-on-first-login). The account holder can
 * change it later through the self-service reset flow (ADR-0002). The
 * password rule is the same as `ResetPasswordDto`: 8–255 characters, at
 * least 1 digit.
 *
 * **Factory scope is required at create:** `factoryIds` carries at least
 * one factory, each inside the caller's own scope (403 otherwise). A user
 * with no factory scope would sit outside every admin's scope, so nobody
 * could ever list, edit or grant them again. Roles are still assigned
 * afterward, through Manage Access.
 */

export type UserStatus = "ACTIVE" | "INACTIVE";

/** `CreateUserDto` — `username` max 64, `name` max 255, `password` 8–255 with a digit, `factoryIds` ≥ 1 unique uuids. */
export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  factoryIds: string[];
}

/** `UpdateUserDto` — `username` deliberately absent, set-once (ticket 06: "username immutable after create"). */
export interface UpdateUserInput {
  name?: string;
  status?: UserStatus;
}
