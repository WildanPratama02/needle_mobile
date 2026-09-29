import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";

import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "@/core/security/token-store";

/**
 * Backend's versioned REST API (Backend/CLAUDE.md §3: `/api/v1/...`), reached
 * through the WebApp's **own origin**. `next.config.mjs` rewrites
 * `/api/v1/:path*` to `API_PROXY_TARGET`, so the browser never makes a
 * cross-origin call: no CORS preflight, no dependence on the Backend's
 * `CORS_ORIGINS` allow-list matching whatever host/LAN IP the app was opened
 * from. Deliberately not configurable here — one path, so a stale absolute
 * URL in someone's `.env` can't silently bypass the proxy.
 */
export const API_BASE_PATH = "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_PATH,
  headers: { "Content-Type": "application/json" },
});

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  // Backend/CLAUDE.md §5: every critical mutating command must carry an
  // Idempotency-Key so retries (network blips, offline-sync catch-up) never
  // double-process. One key per request, not per logical action — a real
  // retry from axios/react-query reuses the same in-flight request object,
  // not a fresh call through this interceptor.
  if (config.method && MUTATING_METHODS.has(config.method) && !config.headers.has("Idempotency-Key")) {
    config.headers.set("Idempotency-Key", uuidv4());
  }

  return config;
});

/**
 * Backend's real envelope — `Backend/src/common/dto/api-response.dto.ts`
 * (`ApiSuccessDto`/`ApiErrorDto`), wired globally via `ResponseFormatInterceptor`.
 * Docs/09 §53 documents a differently-shaped envelope (`request_id` inside
 * `error`, `details` as an object) that the real code doesn't match — this
 * type follows the actual DTO, not the stale doc.
 */
export interface ApiResponseMeta {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details: string[];
  };
  meta: ApiResponseMeta;
}

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const SERVER_UNREACHABLE_MESSAGE = "Cannot reach the server. Please check your connection and try again.";

function hasErrorEnvelope(data: unknown): data is ApiErrorBody {
  const error = (data as Partial<ApiErrorBody> | null | undefined)?.error;
  return typeof error?.message === "string" && error.message.length > 0;
}

/**
 * One place to turn a failed request into the business-language message
 * Docs/18 §54 requires (no stack traces, no internal detail) — the backend
 * already writes human messages into `error.message` per
 * `Backend/src/common/filters/http-exception.filter.ts`, so this trusts that
 * rather than re-deriving copy per status code.
 *
 * "The server could not be reached" is kept apart from "the server said no",
 * because showing a generic failure on a login form reads as wrong
 * credentials. Unreachable means either no response at all (network error,
 * timeout) or a 5xx that is not the backend's envelope — the backend's global
 * filter wraps every error, so a bare 5xx comes from something in front of it:
 * the Next rewrite proxy answers `500 Internal Server Error` (plain text) when
 * `API_PROXY_TARGET` refuses the connection, and a gateway answers 502/503/504.
 *
 * The unreachable message wins over a caller's `fallback`: fallbacks describe
 * a server answer ("this reset link has expired", "no access"), which would be
 * untrue when nothing answered.
 */
export function getApiErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  if (!axios.isAxiosError(error)) return fallback;

  const { response } = error;
  if (response && hasErrorEnvelope(response.data)) return response.data.error.message;

  if (error.code === AxiosError.ERR_CANCELED) return fallback;
  if (!response || response.status >= 500) return SERVER_UNREACHABLE_MESSAGE;

  return fallback;
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * `Backend/src/modules/identity/dto/refresh-token.dto.ts` /
 * `auth-response.dto.ts`: `POST /auth/refresh { refreshToken } ->
 * TokenPairDto { accessToken, refreshToken, expiresIn }` — camelCase, and
 * the refresh token **rotates** (single-use, per `auth.service.ts`). A
 * previous version of this function assumed Docs/09's stale snake-case
 * shape and never stored the rotated token, so a second refresh would
 * silently fail once the old token had been consumed.
 *
 * A bare `axios` call, not `apiClient`, so this request never recurses
 * through the 401 handler below.
 */
/** Exported so session bootstrap (cold page load, memory-only access token lost) can trigger the same rotation the 401 handler below uses reactively. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await axios.post<{ data: { accessToken: string; refreshToken: string; expiresIn: number } }>(
    `${API_BASE_PATH}/auth/refresh`,
    { refreshToken }
  );
  const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
  setAccessToken(accessToken);
  setRefreshToken(nextRefreshToken);
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        refreshPromise ??= refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          return apiClient(originalRequest);
        }
      } catch {
        refreshPromise = null;
      }

      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);
