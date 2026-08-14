import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";

import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "@/core/security/token-store";

/**
 * Base URL points at Backend's versioned REST API (Backend/CLAUDE.md §3:
 * `/api/v1/...`, enforced via NestJS URI versioning in Backend/src/bootstrap.ts).
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1",
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

/**
 * One place to turn a failed request into the business-language message
 * Docs/18 §54 requires (no stack traces, no internal detail) — the backend
 * already writes human messages into `error.message` per
 * `Backend/src/common/filters/http-exception.filter.ts`, so this trusts that
 * rather than re-deriving copy per status code.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
  }
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
    `${apiClient.defaults.baseURL}/auth/refresh`,
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
