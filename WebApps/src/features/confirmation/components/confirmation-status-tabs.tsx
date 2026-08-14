"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusLabel } from "@/shared/components/status-badge";
import { CONFIRMATION_STATUSES, type ConfirmationStatus } from "../api/types";
import { useConfirmationFilterStore } from "../store";

/** Docs 18 §15's exact mockup: 4 tabs, no "All" — matches `ConfirmationStatus` exactly, no invented option. */
export function ConfirmationStatusTabs() {
  const status = useConfirmationFilterStore((s) => s.status);
  const setStatus = useConfirmationFilterStore((s) => s.setStatus);

  return (
    <Tabs value={status} onValueChange={(value) => setStatus(value as ConfirmationStatus)}>
      <TabsList>
        {CONFIRMATION_STATUSES.map((value) => (
          <TabsTrigger key={value} value={value}>
            {getStatusLabel(value)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
