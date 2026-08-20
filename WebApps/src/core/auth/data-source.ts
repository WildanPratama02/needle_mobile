import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type {
  CurrentUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "./types";

/** `POST /auth/login` — `@Public()`, `auth.controller.ts:24`. */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiSuccessBody<LoginResponse>>("/auth/login", credentials);
  return data.data;
}

/**
 * `POST /auth/forgot-password` — unauthenticated, same as `login`. Always
 * 200 (anti-enumeration): the backend never reveals whether the email
 * belongs to an account, so the generic `message` it returns is what the
 * form shows regardless of outcome.
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ApiSuccessBody<ForgotPasswordResponse>>("/auth/forgot-password", payload);
  return data.data;
}

/**
 * `POST /auth/reset-password` — unauthenticated. On success the backend has
 * already revoked all of the user's existing sessions server-side; the
 * client does not attempt to auto-login off the response.
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ApiSuccessBody<ResetPasswordResponse>>("/auth/reset-password", payload);
  return data.data;
}

/** `POST /auth/logout` — `@Public()` (needs no bearer token, just the refresh token being revoked), `auth.controller.ts:51`. 204, no body. */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

/** `GET /auth/me` — any authenticated user, no specific permission required, `auth.controller.ts:59`. */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<ApiSuccessBody<CurrentUser>>("/auth/me");
  return data.data;
}
