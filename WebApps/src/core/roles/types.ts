/**
 * Mirrors `Backend/src/modules/identity/dto/role-response.dto.ts` and
 * `permission-response.dto.ts` exactly (`.scratch/roles-permissions/spec.md`).
 *
 * `memberCount` is scoped to the caller's factory intersection — the same
 * rule every other scoped count in this system follows — even though the
 * catalogue itself (`code`, `permissionCodes`) is global policy, not
 * factory data. See `RoleResponseDto`'s own doc comment for the reasoning.
 */
export interface RoleRow {
  code: string;
  permissionCodes: string[];
  memberCount: number;
}

/** `GET /permissions` — codes only, no description field exists in `PERMISSIONS` today. */
export interface PermissionRow {
  code: string;
}
