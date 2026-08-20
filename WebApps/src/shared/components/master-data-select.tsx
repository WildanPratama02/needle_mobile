"use client";

import type * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  displayLabel,
  useMasterData,
  type MasterDataCollection,
  type MasterDataQuery,
} from "@/core/master-data";

export interface MasterDataSelectProps<C extends MasterDataCollection>
  extends Omit<React.ComponentPropsWithoutRef<typeof SelectTrigger>, "children" | "value" | "onChange"> {
  collection: C;
  /** Narrows the options, e.g. `{ factoryId }` for the four factory-scoped collections. */
  query?: MasterDataQuery;
  /** "" = nothing selected (required-field state). Any other value is either a real id or `allValue`. */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  /** Renders an "All X" sentinel item — for a filter, never for a form field the backend requires a real id for. */
  includeAllOption?: boolean;
  allLabel?: string;
  allValue?: string;
  /** Show the code alongside the name — same convention as `MasterDataName`. */
  withCode?: boolean;
  disabled?: boolean;
}

const DEFAULT_ALL_VALUE = "all";

/**
 * One generic "pick a real row from a master-data collection" select, reused
 * for every Location/Trolley/Needle Type picker across Inventory instead of
 * three near-identical components (Docs/design.md §15 names them separately
 * — FactorySelector/TrolleySelector/NeedleTypeSelector — but they differ only
 * in which collection they read, which is exactly what a type parameter is
 * for). Factory itself has its own `FactorySelect` because its source is
 * `useAuthorizedFactories`, not a raw master-data collection — the scope list
 * comes from the session, never from the catalogue (see factory-scope.ts).
 *
 * Same "select from the real list, no free-text id entry" rule the existing
 * Trolley filter (`ExchangeFilters`) established.
 */
export function MasterDataSelect<C extends MasterDataCollection>({
  collection,
  query,
  value,
  onChange,
  ariaLabel,
  placeholder,
  includeAllOption = false,
  allLabel = "All",
  allValue = DEFAULT_ALL_VALUE,
  withCode = true,
  disabled = false,
  ...triggerProps
}: MasterDataSelectProps<C>) {
  const { data, isLoading } = useMasterData(collection, query ?? {});
  const rows = data ?? [];

  // Radix's Select refuses a "" item value — "" here means "nothing chosen
  // yet" for a required field, distinct from the (non-empty) `allValue`
  // sentinel, so it must render as no selection rather than as an item.
  const selectValue = value === "" ? undefined : value;

  return (
    <Select value={selectValue} onValueChange={onChange} disabled={disabled || isLoading}>
      {/*
        `...triggerProps` forwards whatever `FormControl`'s Radix `Slot`
        injects when this sits inside a `FormField` (`id`, `aria-describedby`,
        `aria-invalid`) — the same wiring `Input` gets "for free" from
        spreading `{...field}`, needed explicitly here since this isn't a bare
        native element.
      */}
      <SelectTrigger aria-label={ariaLabel} {...triggerProps}>
        <SelectValue placeholder={isLoading ? "Loading…" : (placeholder ?? ariaLabel)} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {rows.map((row) => (
          <SelectItem key={row.id} value={row.id}>
            {displayLabel(row, row.id, withCode)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
