"use client";

import * as React from "react";

/**
 * Which record's detail dialog is open on a history screen, mirrored into the
 * URL as `?id=` so a detail is linkable — the Stock Movement ledger's
 * drill-through (spec decision 9) lands on `/inventory/transfer?id=…` and the
 * dialog opens.
 *
 * The route's server `page.tsx` reads `searchParams.id` and passes it in as
 * `initialId`; after that the screen owns the state. `replaceState` (not
 * `pushState`) keeps opening/closing a dialog out of the Back-button history,
 * and Next's router is kept in sync with native history calls (Next ≥ 14.1).
 */
export function useDetailParam(initialId?: string | null) {
  const [selectedId, setSelectedId] = React.useState<string | null>(initialId ?? null);

  React.useEffect(() => {
    setSelectedId(initialId ?? null);
  }, [initialId]);

  const select = React.useCallback((id: string | null) => {
    setSelectedId(id);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("id", id);
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return [selectedId, select] as const;
}
