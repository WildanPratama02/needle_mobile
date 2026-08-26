/**
 * Mirrors `Backend/src/modules/identity/dto/user-response.dto.ts`
 * (`.scratch/users-read-api/spec.md`, GAP-06) exactly. Never a
 * credential-bearing field — no `passwordHash`, `refreshTokens`,
 * `lastLoginAt`, `email` or `phoneNumber`.
 */
export interface UserRow {
  id: string;
  username: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  /** Role codes only, e.g. `["SYSTEM_ADMIN"]` — mirrors `CurrentUser.roles`. */
  roles: string[];
  /** Factory scope. Resolve to a name via `core/master-data`'s factory lookup — factories are not users. */
  factoryIds: string[];
}

/**
 * The only filter `UserQueryDto` declares beyond paging. No `role=` (that's
 * `.scratch/roles-permissions/spec.md`'s follow-up, explicitly out of scope
 * here) and no free-text search (this spec did not ask for one, same
 * reasoning as `core/master-data`'s `MasterDataQuery`).
 */
export interface UserQuery {
  factoryId?: string;
}

/**
 * The Administration → Users screen's own filter shape — same "all" sentinel
 * convention `DeviceListFilters` and `AuditLogFilters` use, sourced from
 * TopBar's global factory-scope selector.
 */
export interface UserListFilters {
  /** "all" = omit. */
  factoryId: string;
  page: number;
  pageSize: number;
}

export interface PagedUsers {
  items: UserRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const DEFAULT_USER_LIST_FILTERS: UserListFilters = {
  factoryId: "all",
  page: 1,
  pageSize: 20,
};
