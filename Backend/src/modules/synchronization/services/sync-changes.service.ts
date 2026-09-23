import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { toExchangeResponse } from '../../exchange/dto/exchange-response.mapper';
import {
  ExchangeRepository,
  ExchangeWithContext,
} from '../../exchange/repositories/exchange.repository';
import { MobileExchangeDto } from '../dto/mobile-response.dto';
import { MAX_PULL_CHANGES, PULL_SETTLE_MS } from '../sync.constants';
import { ORIGIN, SyncWatermark, decodeCursor, encodeCursor } from './sync-cursor';

interface ChangedRow {
  id: string;
  changed_at: string;
}

/** An exchange as the tablet reconciles it (Docs/15 §8). */
export function toMobileExchange(exchange: ExchangeWithContext): MobileExchangeDto {
  return {
    ...toExchangeResponse(exchange),
    clientTransactionId: exchange.clientTransactionId,
    confirmationStatus: exchange.confirmation?.status ?? null,
  };
}

/**
 * The pull half of `/mobile/sync`: which of a device's exchanges changed since
 * the tablet last looked — including changes it did not make, such as an
 * approver's decision or a supervisor's cancel.
 *
 * An exchange's change time is the later of its own and its confirmation's
 * `updated_at`, so a decision reaches the tablet without the approval module
 * having to touch the exchange row (Docs/adr/0007).
 */
@Injectable()
export class SyncChangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchanges: ExchangeRepository,
  ) {}

  private static readonly CHANGED_AT = Prisma.sql`GREATEST(e.updated_at, COALESCE(c.updated_at, e.updated_at))`;

  /** Settled changes only — see `PULL_SETTLE_MS`. */
  private static cutoff(): string {
    return new Date(Date.now() - PULL_SETTLE_MS).toISOString();
  }

  private query(
    deviceId: string,
    after: SyncWatermark,
    order: 'ASC' | 'DESC',
    limit: number,
  ): Promise<ChangedRow[]> {
    const changedAt = SyncChangesService.CHANGED_AT;
    const direction = order === 'ASC' ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    return this.prisma.$queryRaw<ChangedRow[]>`
      SELECT e.id::text AS id,
             to_char(${changedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS changed_at
        FROM exchanges e
        LEFT JOIN confirmations c ON c.exchange_id = e.id
       WHERE e.device_id = ${deviceId}::uuid
         AND ${changedAt} <= ${SyncChangesService.cutoff()}::timestamptz
         AND (${changedAt}, e.id) > (${after.t}::timestamptz, ${after.id}::uuid)
       ORDER BY ${changedAt} ${direction}, e.id ${direction}
       LIMIT ${limit}`;
  }

  /** "Now" for this device — where a freshly bootstrapped tablet starts pulling. */
  async currentCursor(deviceId: string): Promise<string> {
    const [latest] = await this.query(deviceId, ORIGIN, 'DESC', 1);
    return encodeCursor(latest ? { t: latest.changed_at, id: latest.id } : ORIGIN);
  }

  async changesSince(
    deviceId: string,
    cursor: string | null | undefined,
  ): Promise<{ exchanges: MobileExchangeDto[]; hasMore: boolean; nextCursor: string }> {
    const after = cursor ? decodeCursor(cursor) : ORIGIN;
    const rows = await this.query(deviceId, after, 'ASC', MAX_PULL_CHANGES + 1);
    const page = rows.slice(0, MAX_PULL_CHANGES);

    const loaded = page.length > 0 ? await this.exchanges.findManyByIds(page.map((r) => r.id)) : [];
    const byId = new Map(loaded.map((exchange) => [exchange.id, exchange]));
    const last = page[page.length - 1];

    return {
      exchanges: page
        .map((row) => byId.get(row.id))
        .filter((exchange): exchange is ExchangeWithContext => exchange !== undefined)
        .map(toMobileExchange),
      hasMore: rows.length > MAX_PULL_CHANGES,
      nextCursor: encodeCursor(last ? { t: last.changed_at, id: last.id } : after),
    };
  }
}
