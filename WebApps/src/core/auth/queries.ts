import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from "@/core/security/token-store";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";
import type { ForgotPasswordRequest, LoginRequest, ResetPasswordRequest } from "./types";
import { fetchCurrentUser, forgotPassword, login, logout, resetPassword } from "./data-source";

export const authKeys = {
  currentUser: ["auth", "me"] as const,
};

/**
 * Waits for `SessionProvider`'s bootstrap (cold-load silent refresh) before
 * ever calling `GET /auth/me` — otherwise a fresh page load would race the
 * bootstrap and read "unauthenticated" off a token that hasn't been
 * restored yet. Doesn't retry: a 401 here means "not logged in," not a
 * transient failure.
 */
export function useCurrentUser() {
  const bootstrapped = useSessionBootstrapStore((s) => s.ready);

  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: fetchCurrentUser,
    enabled: bootstrapped,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (response) => {
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      // The login response's `user` is the narrower `LoginUserDto` (no
      // permissions/scope) — invalidate rather than seed the cache, so the
      // next render fetches the real `CurrentUser` from `/auth/me`.
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
}

/**
 * Deliberately no `onSuccess` side effects beyond the mutation itself — the
 * backend's response is the same generic message whether or not the
 * account exists (anti-enumeration), so there's nothing session-related to
 * do with it here.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => forgotPassword(payload),
  });
}

/**
 * No token storage on success — the backend revokes all of the user's
 * existing sessions server-side on a successful reset, so this deliberately
 * does not auto-login; the caller redirects to `/login` instead.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => resetPassword(payload),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken);
      }
    },
    onSettled: () => {
      // Revoking the token can itself fail (already expired, network down)
      // — the client-side session ends either way, same principle as
      // `client.ts`'s 401 handler.
      clearTokens();
      queryClient.setQueryData(authKeys.currentUser, undefined);
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
}
