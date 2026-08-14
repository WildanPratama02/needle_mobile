import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { CurrentUser, LoginRequest, LoginResponse } from "./types";

/** `POST /auth/login` — `@Public()`, `auth.controller.ts:24`. */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiSuccessBody<LoginResponse>>("/auth/login", credentials);
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
