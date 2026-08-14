"use client";

import * as React from "react";

import { getAccessToken, getRefreshToken } from "@/core/security/token-store";
import { refreshAccessToken } from "@/core/api/client";
import { useSessionBootstrapStore } from "@/core/security/session-bootstrap-store";

/**
 * Runs once, before anything reads session state. The access token lives in
 * memory only (`core/security/token-store.ts`), so a cold page load has
 * none — if a refresh token survived in sessionStorage, this silently
 * exchanges it for a fresh access token so `useCurrentUser` doesn't have to
 * bounce through a 401 first. Never throws: a failed attempt just leaves the
 * user logged out, same as never having a token at all.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const setReady = useSessionBootstrapStore((s) => s.setReady);

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getAccessToken() && getRefreshToken()) {
        try {
          await refreshAccessToken();
        } catch {
          // No usable session — useCurrentUser simply won't resolve a user.
        }
      }
      if (!cancelled) setReady();
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setReady]);

  return <>{children}</>;
}
