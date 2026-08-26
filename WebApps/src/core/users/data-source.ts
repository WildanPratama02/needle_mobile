import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { PagedUsers, UserListFilters, UserQuery, UserRow } from "./types";

/**
 * The single seam for every `/users` read — `queries.ts` and the
 * Administration → Users screen go through here, nothing calls `apiClient`
 * for a user directly.
 *
 * Real endpoints, verified in source: `Backend/src/modules/identity`
 * registers `GET /users` and `GET /users/:id`, both requiring `USER_MANAGE`
 * (`.scratch/users-read-api/spec.md`, GAP-06).
 */

/** The backend caps `pageSize` at 100, so asking for more just wastes the round trip. */
const MAX_PAGE_SIZE = 100;

/** Same ceiling `core/master-data/data-source.ts` applies to its fetch-all loop, for the same reason. */
const MAX_PAGES = 20;

/** `GET /users`, one page — real server pagination, for the Administration → Users list screen. */
export async function fetchUsers(filters: UserListFilters): Promise<PagedUsers> {
  const { data } = await apiClient.get<ApiSuccessBody<UserRow[]>>("/users", {
    params: {
      factoryId: filters.factoryId === "all" ? undefined : filters.factoryId,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  });

  return {
    items: data.data,
    page: data.meta.page ?? filters.page,
    pageSize: data.meta.pageSize ?? filters.pageSize,
    total: data.meta.total ?? 0,
    totalPages: data.meta.totalPages ?? 0,
  };
}

/**
 * Fetches the whole directory the caller can see, for the id-to-name lookup
 * layer — mirrors `core/master-data/data-source.ts`'s `fetchMasterData`
 * fetch-all-pages loop exactly (`.scratch/users-read-api/spec.md`'s
 * Implementation Decisions: "Same internal shape as core/master-data ...
 * mirrored, not imported").
 *
 * Also the seam `.scratch/roles-permissions/spec.md`'s role-member lookup
 * goes through — `fetchAllUsers({ role: code })` resolves "who holds this
 * role" via `GET /users?role=<code>`, the one new query param that spec
 * adds, rather than a second endpoint.
 */
export async function fetchAllUsers(query: UserQuery = {}): Promise<UserRow[]> {
  const params = { factoryId: query.factoryId, role: query.role, pageSize: MAX_PAGE_SIZE, page: 1 };

  const { data } = await apiClient.get<ApiSuccessBody<UserRow[]>>("/users", { params });
  const totalPages = data.meta.totalPages ?? 1;

  if (totalPages <= 1) {
    return data.data;
  }

  // Remaining pages in parallel rather than in sequence — they are independent
  // reads and the directory is already known to be small enough to hold.
  const rest = await Promise.all(
    Array.from({ length: Math.min(totalPages, MAX_PAGES) - 1 }, (_, i) =>
      apiClient
        .get<ApiSuccessBody<UserRow[]>>("/users", { params: { ...params, page: i + 2 } })
        .then((response) => response.data.data),
    ),
  );

  return [data.data, ...rest].flat();
}

/** `GET /users/:id` — not used by any screen this spec builds yet, kept for parity with the backend route. */
export async function fetchUser(id: string): Promise<UserRow> {
  const { data } = await apiClient.get<ApiSuccessBody<UserRow>>(`/users/${id}`);
  return data.data;
}
