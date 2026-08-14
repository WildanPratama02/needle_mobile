"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { displayLabel, useMasterData } from "@/core/master-data";
import { getStatusLabel } from "@/shared/components/status-badge";
import { EXCHANGE_STATES, type ExchangeState } from "../api/types";
import { useTransactionsFilterStore } from "../store";

/** Radix refuses an empty-string item value, so "all" is the sentinel here and `""` stays the store's "omit the param". */
const ALL_TROLLEYS = "all";

/**
 * Factory scope is TopBar's job (Docs/18 §6) — deliberately not duplicated
 * here. Only Trolley and Status are rendered, matching what `GET /exchanges`
 * actually filters on.
 *
 * Trolley is a select, not free text. The API parameter is a uuid
 * (`ListExchangesQueryDto.trolleyId`), so a typed trolley code produced a 400
 * rather than a result — the only input that ever worked was a pasted uuid.
 * Selecting from the real trolley list means the filter cannot be given a
 * value the API will reject.
 */
export function ExchangeFilters() {
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const trolleyId = useTransactionsFilterStore((s) => s.trolleyId);
  const status = useTransactionsFilterStore((s) => s.status);
  const setTrolleyId = useTransactionsFilterStore((s) => s.setTrolleyId);
  const setStatus = useTransactionsFilterStore((s) => s.setStatus);

  // Narrowed to the selected factory so the list stays short and can only
  // offer trolleys whose exchanges are visible under the current scope.
  const { data: trolleys, isLoading } = useMasterData(
    "trolleys",
    selectedFactoryId === "all" ? {} : { factoryId: selectedFactoryId },
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={trolleyId === "" ? ALL_TROLLEYS : trolleyId}
        onValueChange={(value: string) => setTrolleyId(value === ALL_TROLLEYS ? "" : value)}
      >
        <SelectTrigger className="w-56" aria-label="Filter by Trolley">
          <SelectValue placeholder={isLoading ? "Loading trolleys…" : "Trolley"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TROLLEYS}>All Trolleys</SelectItem>
          {(trolleys ?? []).map((trolley) => (
            <SelectItem key={trolley.id} value={trolley.id}>
              {displayLabel(trolley, trolley.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(value) => setStatus(value as ExchangeState | "ALL")}>
        <SelectTrigger className="w-56" aria-label="Filter by Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          {EXCHANGE_STATES.map((state) => (
            <SelectItem key={state} value={state}>
              {getStatusLabel(state)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
