"use client";

import type * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthorizedFactories } from "@/core/permissions/factory-scope";

export interface FactorySelectProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SelectTrigger>, "children" | "value" | "onChange"> {
  /** "" = nothing selected. Never "all" here — a create form always posts one real factoryId. */
  value: string;
  onChange: (factoryId: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Factory picker for a screen that *writes* data (Receiving/Transfer/
 * Adjustment forms). Deliberately not the TopBar factory-scope selector and
 * not a `MasterDataSelect` over the `factories` catalogue: a create form must
 * only offer factories this user is actually scoped to (`GET /auth/me`
 * `factoryIds`), same source `useAuthorizedFactories` already uses for the
 * TopBar switcher — the catalogue alone must never be able to widen what a
 * user believes they can act on.
 */
export function FactorySelect({
  value,
  onChange,
  ariaLabel = "Factory",
  placeholder = "Select factory",
  disabled = false,
  ...triggerProps
}: FactorySelectProps) {
  const factories = useAuthorizedFactories();

  return (
    <Select value={value === "" ? undefined : value} onValueChange={onChange} disabled={disabled}>
      {/* `...triggerProps` forwards what FormControl's Radix Slot injects (id, aria-describedby, aria-invalid) — see MasterDataSelect's comment. */}
      <SelectTrigger aria-label={ariaLabel} {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {factories.map((factory) => (
          <SelectItem key={factory.id} value={factory.id}>
            {factory.code} — {factory.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
