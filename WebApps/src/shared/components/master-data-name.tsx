"use client";

import {
  displayLabel,
  useLookup,
  type MasterDataCollection,
  type MasterDataQuery,
} from "@/core/master-data";

interface MasterDataNameProps {
  collection: MasterDataCollection;
  id: string | null | undefined;
  query?: MasterDataQuery;
  /** Rendered when the reference itself is absent — a null foreign key, not a failed lookup. */
  emptyLabel?: string;
  /** Shows the code alongside the name, for columns where the code is what people quote. */
  withCode?: boolean;
}

/**
 * Renders the name behind a master-data id.
 *
 * Safe to use once per table cell: every instance subscribes to the same
 * cached collection query, so fifty rows still cost one request. Resolution
 * happens against the whole collection rather than per id — a lookup per row
 * would turn one screen into one request per row.
 *
 * An unresolved id renders as the id, in the muted monospace treatment this
 * app uses for raw identifiers, so it stays visibly distinguishable from a
 * real name. Nothing here ever derives a label from an id.
 */
export function MasterDataName({
  collection,
  id,
  query,
  emptyLabel = "—",
  withCode = false,
}: MasterDataNameProps) {
  const lookup = useLookup(collection, query);

  if (!id) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  const row = lookup.get(id);

  if (!row) {
    // Unresolved ids keep the muted monospace treatment this app uses for raw
    // identifiers, so they stay visibly distinct from a resolved name.
    return (
      <span
        className="font-mono text-xs text-slate-500"
        title={lookup.isLoading ? "Resolving…" : id}
      >
        {displayLabel(undefined, id)}
      </span>
    );
  }

  return <span title={row.code}>{displayLabel(row, id, withCode)}</span>;
}
