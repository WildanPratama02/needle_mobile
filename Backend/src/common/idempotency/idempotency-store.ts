import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

import { PrismaService } from '../../database/prisma.service';

export interface ClaimRequest {
  key: string;
  /** Scope of the key: `METHOD /path` for HTTP, `SYNC <commandType>` for sync. */
  endpoint: string;
  requestHash: string;
  actorUserId?: string;
  deviceId?: string;
}

export type ClaimResult =
  | { outcome: 'CLAIMED' }
  | { outcome: 'REPLAY'; responseStatus: number; responseBody: unknown }
  | { outcome: 'IN_PROGRESS' }
  | { outcome: 'MISMATCH' };

/**
 * The `idempotency_keys` table behind every retry-safe command (Backend/CLAUDE.md
 * §4): the HTTP middleware and the mobile sync engine both claim, complete and
 * release keys through this one class.
 *
 * **In-flight reclaim.** A request that claims a key and then dies before
 * recording its outcome would leave the key "in progress" until the retention
 * sweep, answering every retry with 409 — for an offline tablet that retries by
 * design, a stuck command. Past `IDEMPOTENCY_INFLIGHT_TIMEOUT_SECONDS` a retry
 * takes the key over with a compare-and-set on the stale row's `createdAt`, the
 * same pattern as the stock decrement: of two concurrent retries exactly one
 * wins, the other still sees "in progress".
 */
@Injectable()
export class IdempotencyStore {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get retentionMs(): number {
    return this.config.get<number>('domain.idempotencyRetentionHours', 24) * 3600 * 1000;
  }

  private get inflightTimeoutMs(): number {
    return this.config.get<number>('domain.idempotencyInflightTimeoutSeconds', 60) * 1000;
  }

  static hash(body: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(body ?? {}))
      .digest('hex');
  }

  async claim(request: ClaimRequest): Promise<ClaimResult> {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: {
        idempotencyKey_endpoint: { idempotencyKey: request.key, endpoint: request.endpoint },
      },
    });

    if (existing) {
      // Same key, different payload: a client bug. Replaying the first
      // response would silently discard the second request's intent.
      if (existing.requestHash !== request.requestHash) {
        return { outcome: 'MISMATCH' };
      }

      if (existing.responseStatus !== null) {
        return {
          outcome: 'REPLAY',
          responseStatus: existing.responseStatus,
          responseBody: existing.responseBody,
        };
      }

      const now = new Date();
      if (now.getTime() - existing.createdAt.getTime() < this.inflightTimeoutMs) {
        return { outcome: 'IN_PROGRESS' };
      }

      const { count } = await this.prisma.idempotencyKey.updateMany({
        where: {
          idempotencyKey: request.key,
          endpoint: request.endpoint,
          responseStatus: null,
          createdAt: existing.createdAt,
        },
        data: {
          createdAt: now,
          actorUserId: request.actorUserId,
          deviceId: request.deviceId,
          expiresAt: new Date(now.getTime() + this.retentionMs),
        },
      });

      return count === 1 ? { outcome: 'CLAIMED' } : { outcome: 'IN_PROGRESS' };
    }

    try {
      await this.prisma.idempotencyKey.create({
        data: {
          idempotencyKey: request.key,
          endpoint: request.endpoint,
          requestHash: request.requestHash,
          actorUserId: request.actorUserId,
          deviceId: request.deviceId,
          // Stamped at insert so the retention sweep has something to act on.
          // Past this the reservation is swept and an identical retry runs for
          // real, which is why the window must outlast the mobile client's
          // offline retry horizon.
          expiresAt: new Date(Date.now() + this.retentionMs),
        },
      });
    } catch {
      // Lost the race against a concurrent identical request.
      return { outcome: 'IN_PROGRESS' };
    }

    return { outcome: 'CLAIMED' };
  }

  /** Records a successful outcome so a retry replays it. */
  async complete(key: string, endpoint: string, status: number, body: unknown): Promise<void> {
    await this.prisma.idempotencyKey.updateMany({
      where: { idempotencyKey: key, endpoint },
      data: { responseStatus: status, responseBody: body as Prisma.InputJsonValue },
    });
  }

  /** A failed command did not happen: drop the claim so a retry runs for real. */
  async release(key: string, endpoint: string): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({ where: { idempotencyKey: key, endpoint } });
  }
}
