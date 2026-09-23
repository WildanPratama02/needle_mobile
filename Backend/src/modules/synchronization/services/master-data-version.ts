import { createHash } from 'crypto';

export interface Versioned {
  id: string;
  updatedAt: Date;
}

/**
 * A short fingerprint of a master-data collection (Docs/15 §17).
 *
 * Built from every row's id and `updatedAt` — inactive rows included — so a
 * create, an edit, a (de)activation or a deletion each change it. `extra`
 * lets a collection fold in a related row it also sends, such as a storage
 * mapping's location name. No version column, so no migration (Docs/adr/0007).
 */
export function versionOf<T extends Versioned>(
  rows: T[],
  extra: (row: T) => string = () => '',
): string {
  const lines = rows.map((row) => `${row.id}:${row.updatedAt.toISOString()}:${extra(row)}`).sort();

  return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);
}
