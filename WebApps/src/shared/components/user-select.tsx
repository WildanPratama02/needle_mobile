"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsersLookupData, userDisplayLabel } from "@/core/users";

export interface UserSelectProps {
  /** "" = the "all" sentinel, same convention `MasterDataSelect` uses for its `includeAllOption`. */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  allLabel?: string;
  allValue?: string;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ALL_VALUE = "ALL";

/**
 * A dropdown of real users, sourced from `core/users` — the Audit actor
 * filter's fix, mirroring GAP-02's trolley-filter fix exactly
 * (`.scratch/users-read-api/spec.md`'s Implementation Decisions): a caller
 * can no longer type a value `AuditQueryDto.actorUserId`'s `@IsUUID()`
 * rejects, because there is no longer a free-text box to type it into.
 *
 * Assumes it is only ever mounted once the caller holds `USER_MANAGE` — the
 * parent decides whether to render this or its own free-text fallback ("If
 * the viewer lacks USER_MANAGE, the filter falls back to its current
 * free-text-labelled-as-id behavior rather than disappearing").
 */
export function UserSelect({
  value,
  onChange,
  ariaLabel,
  allLabel = "All Actors",
  allValue = DEFAULT_ALL_VALUE,
  className,
  disabled = false,
}: UserSelectProps) {
  const { data, isLoading } = useUsersLookupData();
  const rows = data ?? [];
  const selectValue = value === "" ? allValue : value;

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onChange(next === allValue ? "" : next)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={isLoading ? "Loading…" : ariaLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>{allLabel}</SelectItem>
        {rows.map((row) => (
          <SelectItem key={row.id} value={row.id}>
            {userDisplayLabel(row, row.id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
