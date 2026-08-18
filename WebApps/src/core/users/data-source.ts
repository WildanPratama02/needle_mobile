import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { UserRow } from "./types";

/**
 * The single seam for user-directory reads — `queries.ts` and every call site
 * go through here, nothing calls `apiClient` for users directly.
 *
 * Real endpoint, verified in source: `Backend/src/modules/identity`'s
 * `UserController` registers `GET /users` and `GET /users/:id`, both requiring
 * `USER_MANAGE` (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * Mirrors `core/master-data/data-source.ts` — a separate module, not an
 * added collection there, because `USER_MANAGE` is a different permission
 * from `MASTER_VIEW`. Folding this in would let a `MASTER_VIEW`-only caller's
 * UI appear to resolve user names it has no permission to fetch.
 */

const MAX_PAGE_SIZE = 100;

/** Same ceiling as `core/master-data` — past this the directory needs a real search endpoint, not a bigger number here. */
const MAX_PAGES = 20;

export interface UserQuery {
  factoryId?: string;
  status?: "ACTIVE" | "INACTIVE";
}

/** Fetches the whole directory the caller may see. Per collection, never per id — see `core/master-data` for why. */
export async function fetchUsers(query: UserQuery = {}): Promise<UserRow[]> {
  const params = { factoryId: query.factoryId, status: query.status, pageSize: MAX_PAGE_SIZE, page: 1 };

  const { data } = await apiClient.get<ApiSuccessBody<UserRow[]>>("/users", { params });
  const totalPages = data.meta.totalPages ?? 1;

  if (totalPages <= 1) {
    return data.data;
  }

  const rest = await Promise.all(
    Array.from({ length: Math.min(totalPages, MAX_PAGES) - 1 }, (_, i) =>
      apiClient
        .get<ApiSuccessBody<UserRow[]>>("/users", { params: { ...params, page: i + 2 } })
        .then((response) => response.data.data),
    ),
  );

  return [data.data, ...rest].flat();
}
