import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

export const SEQUENCE_SCOPES = {
  EXCHANGE: 'EXCHANGE',
  CONFIRMATION: 'CONFIRMATION',
  MOVEMENT: 'MOVEMENT',
} as const;

const PREFIXES: Record<string, string> = {
  EXCHANGE: 'EXC',
  CONFIRMATION: 'CNF',
  MOVEMENT: 'MV',
};

/**
 * Daily, per-scope counters behind `exchange_number` and `confirmation_number`
 * (spec round 4 Q13). Format: `EXC-YYYYMMDD-000001`.
 *
 * Application-level rather than a Postgres sequence because the number resets
 * each day and carries a scope prefix, neither of which a sequence expresses.
 */
@Injectable()
export class NumberSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserves the next value for (scope, today) and formats it.
   *
   * The increment is a single `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`,
   * so concurrent callers serialise on the unique index and can never receive
   * the same number — a read-then-write pair would hand out duplicates under
   * load, and `exchange_number` is UNIQUE.
   *
   * Pass the surrounding transaction client when generating inside one, so a
   * rolled-back exchange does not leave a consumed number behind.
   */
  async next(scope: string, client: Prisma.TransactionClient | PrismaService = this.prisma) {
    const today = new Date();
    const dateOnly = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    const rows = await client.$queryRaw<{ last_value: number }[]>`
      INSERT INTO number_sequences (id, scope, date, last_value, created_at, updated_at)
      VALUES (gen_random_uuid(), ${scope}, ${dateOnly}::date, 1, now(), now())
      ON CONFLICT (scope, date)
      DO UPDATE SET last_value = number_sequences.last_value + 1, updated_at = now()
      RETURNING last_value
    `;

    const value = rows[0].last_value;
    const prefix = PREFIXES[scope] ?? scope;
    const datePart = dateOnly.toISOString().slice(0, 10).replace(/-/g, '');

    return `${prefix}-${datePart}-${String(value).padStart(6, '0')}`;
  }
}
