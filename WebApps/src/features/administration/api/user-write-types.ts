/**
 * Users' write shapes (ticket 06,
 * `.scratch/admin-panel-crud/issues/06-administration-users-write-crud.md`).
 * Reads already fit `core/users`'s `UserRow` shape — only the request DTOs
 * are new, mirroring `Docs/12-OpenAPI-Swagger-Specification.md` §16 "User /
 * RBAC API".
 *
 * **`CreateUserInput` deliberately carries no credential field** — ticket 06
 * acceptance: "do not invent a 'set password' field in the create DTO
 * without confirming with the user how an admin-created account gets its
 * first credential (invite-link vs temp-password vs forced
 * reset-on-first-login) — this is adjacent to the 'Reset Access' contract
 * gap ... and should be resolved alongside it, not guessed independently."
 * How a newly created account receives its first credential is therefore
 * left to whatever the backend does server-side once this route exists —
 * not invented here.
 */

export type UserStatus = "ACTIVE" | "INACTIVE";

/** `CreateUserDto`, credential field intentionally omitted (see file header). */
export interface CreateUserInput {
  username: string;
  name: string;
}

/** `UpdateUserDto` — `username` deliberately absent, set-once (ticket 06: "username immutable after create"). */
export interface UpdateUserInput {
  name?: string;
  status?: UserStatus;
}
