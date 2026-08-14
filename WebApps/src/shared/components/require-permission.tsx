"use client";

import type { ReactNode } from "react";
import axios from "axios";

import { Card, CardContent } from "@/components/ui/card";
import { getApiErrorMessage } from "@/core/api/client";
import { useCurrentUser } from "@/core/auth/queries";
import { usePermission, type PermissionCode } from "@/core/permissions";
import { ErrorState } from "@/shared/components/error-state";

export const ACCESS_DENIED_MESSAGE = "You do not have access to this resource.";

interface RequirePermissionProps {
  permission: PermissionCode;
  children: ReactNode;
  /**
   * The screen's own request error, when it has one. A 403 from the server is
   * rendered as access-denied rather than as a generic failure — that is the
   * backstop for a client-side answer that went stale, e.g. a grant revoked
   * after the page loaded.
   */
  error?: unknown;
  isError?: boolean;
}

/**
 * Gates a screen on one permission, per Docs/18 §60's ACCESS DENIED pattern.
 *
 * One wrapper so every gated screen gates identically. Before this, three
 * behaviours existed for one rule: two screens checked the session and
 * disabled their query, and two fired the request and rendered the 403 as a
 * generic error.
 *
 * **Hiding a screen is not securing a route.** The backend refuses regardless,
 * and does so whether the screen was reached from the menu or by typing the
 * URL. This exists so a user is told plainly rather than shown a broken page,
 * and so a request known to be refused is never sent.
 *
 * Callers pass `usePermission(...)` into their own query's `enabled` flag as
 * well — the wrapper cannot do that for them, because the hook runs inside the
 * child.
 */
export function RequirePermission({
  permission,
  children,
  error,
  isError = false,
}: RequirePermissionProps) {
  const allowed = usePermission(permission);
  const { isPending } = useCurrentUser();
  const forbiddenByServer =
    isError && axios.isAxiosError(error) && error.response?.status === 403;

  /**
   * While the session is still in flight the answer is not "no", it is "not
   * yet" — rendering access-denied there would flash a refusal at a user who
   * turns out to be permitted. The children render instead, showing their own
   * loading state. No data leaks by doing so: the caller passes the same
   * permission answer into its query's `enabled` flag, which is false while
   * pending, so only empty chrome is on screen.
   */
  if ((allowed || isPending) && !forbiddenByServer) {
    return <>{children}</>;
  }

  /**
   * Both refusals land on the same message. A server 403 is a denial, not a
   * generic failure, so it must not read as "something went wrong" — but if
   * the backend explained itself, that explanation wins over the generic copy.
   * With no error at all (the client-side denial) there is nothing to prefer,
   * so the fallback is what shows.
   */
  return (
    <Card>
      <CardContent className="pt-5">
        <ErrorState message={getApiErrorMessage(error, ACCESS_DENIED_MESSAGE)} />
      </CardContent>
    </Card>
  );
}
