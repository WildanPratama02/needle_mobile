/**
 * Minimal client-side token holder. Access token lives in memory only
 * (never localStorage — reduces XSS token-theft surface). Refresh token
 * rides in sessionStorage — confirmed final, not a placeholder: `POST
 * /auth/login`/`/auth/refresh` (`identity/controllers/auth.controller.ts`)
 * return both tokens as plain JSON body fields, no `Set-Cookie` involved, so
 * there is no httpOnly-cookie delivery to migrate to.
 */
let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = "needle_refresh_token";

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  accessToken = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
