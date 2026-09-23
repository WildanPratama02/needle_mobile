import { BadRequestException } from '@nestjs/common';
import { isISO8601, isUUID } from 'class-validator';

/**
 * A position in one device's stream of exchange changes: the change time and
 * the exchange id that breaks ties between rows changed in the same instant.
 *
 * `t` keeps the database's microsecond text form rather than a JS `Date`,
 * which would truncate to milliseconds and could skip or repeat a row whose
 * change time differs only below that.
 */
export interface SyncWatermark {
  t: string;
  id: string;
}

/** "Before everything" — the position a device with no history starts from. */
export const ORIGIN: SyncWatermark = {
  t: '1970-01-01T00:00:00.000000Z',
  id: '00000000-0000-0000-0000-000000000000',
};

/** Opaque to the tablet (Docs/12 §19): it stores and returns it, never reads it. */
export function encodeCursor(watermark: SyncWatermark): string {
  return Buffer.from(JSON.stringify(watermark), 'utf8').toString('base64url');
}

/** @throws BadRequestException for anything this server did not issue. */
export function decodeCursor(cursor: string): SyncWatermark {
  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestException('Malformed sync cursor');
  }

  const candidate = parsed as Partial<SyncWatermark> | null;

  if (
    !candidate ||
    typeof candidate.t !== 'string' ||
    typeof candidate.id !== 'string' ||
    !isISO8601(candidate.t, { strict: true }) ||
    // The origin's all-zero id is not a v4 UUID, so accept any version.
    !isUUID(candidate.id, 'all')
  ) {
    throw new BadRequestException('Malformed sync cursor');
  }

  return { t: candidate.t, id: candidate.id };
}
