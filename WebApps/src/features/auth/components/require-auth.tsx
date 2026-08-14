"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/core/auth/queries";

/**
 * Lives in `features/auth`, not `shared/` — `shared/components/AppShell`
 * stays feature-agnostic (shared must not depend on a feature), so every
 * protected route composes this explicitly: `<RequireAuth><AppShell>...`.
 * `useCurrentUser` already waits for `SessionProvider`'s bootstrap — a
 * failed/absent session redirects to `/login`; frontend hiding is UX only,
 * the backend remains the real authorization boundary (Docs/18 §3.3/§64).
 *
 * Uses `isPending`, not `isLoading`: `useCurrentUser` is `enabled: false`
 * until bootstrap finishes, and TanStack Query v5's `isLoading` is
 * `isPending && isFetching` — a *disabled* query is never "fetching", so
 * `isLoading` reads `false` the instant the query is merely disabled, not
 * only once it's genuinely settled. Checking `isLoading` here fired the
 * redirect to `/login` on literally every first render, before bootstrap
 * had a chance to run — `isPending` (true until the query has ever
 * succeeded or errored, disabled or not) is the state that actually means
 * "don't know yet."
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError } = useCurrentUser();

  React.useEffect(() => {
    if (!isPending && (isError || !user)) {
      router.replace("/login");
    }
  }, [isPending, isError, user, router]);

  if (isPending || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
