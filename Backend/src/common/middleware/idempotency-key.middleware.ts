import {
  ConflictException,
  Injectable,
  NestMiddleware,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { PrismaService } from '../../database/prisma.service';
import { RequestWithContext } from '../interfaces/request-context.interface';

/**
 * Makes state-changing commands safe to retry (ADR-005 — mobile is offline
 * first and will resend).
 *
 * The first response for a key is stored and replayed verbatim on retry, so a
 * command never executes twice. Implemented once here rather than per module,
 * as Backend/CLAUDE.md §5 requires.
 *
 * Scoped by (key, endpoint), not by key alone (round 4 Q7): mobile sends one
 * key per state transition, so the same key legitimately appears against
 * different endpoints.
 */
@Injectable()
export class IdempotencyKeyMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get retentionHours(): number {
    return this.config.get<number>('domain.idempotencyRetentionHours', 24);
  }

  private static hashBody(body: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(body ?? {}))
      .digest('hex');
  }

  /** Refreshes `meta.requestId` on a replayed envelope, leaving `data` intact. */
  private static restamp(body: unknown, requestId: string | undefined): unknown {
    if (!body || typeof body !== 'object' || !requestId) {
      return body;
    }

    const envelope = body as { meta?: Record<string, unknown> };

    if (!envelope.meta || typeof envelope.meta !== 'object') {
      return body;
    }

    return { ...envelope, meta: { ...envelope.meta, requestId } };
  }

  async use(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    const key =
      (req.header('idempotency-key') ?? '').trim() ||
      // Mobile's sync payloads carry the same intent under another name.
      (typeof (req.body as Record<string, unknown> | undefined)?.clientTransactionId === 'string'
        ? ((req.body as Record<string, string>).clientTransactionId ?? '').trim()
        : '');

    // No key: nothing to deduplicate. Routes that require one enforce that
    // themselves — this middleware never invents a policy.
    if (!key) {
      next();
      return;
    }

    // Middleware runs before routing, so the matched route pattern is not
    // available yet — the concrete path is used instead. That scopes a key to
    // one resource as well as one endpoint, which is stricter than round 4 Q7
    // requires and never merges two distinct calls. The query string is
    // dropped: it belongs to reads, not to the command being deduplicated.
    const endpoint = `${req.method} ${req.originalUrl.split('?')[0]}`;
    const requestHash = IdempotencyKeyMiddleware.hashBody(req.body);
    const user = req.user;

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { idempotencyKey_endpoint: { idempotencyKey: key, endpoint } },
    });

    if (existing) {
      // Same key, different payload: a client bug. Replaying the first
      // response would silently discard the second request's intent.
      if (existing.requestHash !== requestHash) {
        throw new UnprocessableEntityException(
          'Idempotency-Key was already used with a different request body',
        );
      }

      if (existing.responseStatus === null) {
        throw new ConflictException('An identical request is still in progress');
      }

      // Replay the original outcome, but stamp it with *this* request's id:
      // the caller needs its own trace id back, not the first caller's.
      res
        .status(existing.responseStatus)
        .json(IdempotencyKeyMiddleware.restamp(existing.responseBody, req.requestId));
      return;
    }

    try {
      await this.prisma.idempotencyKey.create({
        data: {
          idempotencyKey: key,
          endpoint,
          requestHash,
          actorUserId: user?.id,
          deviceId: req.header('x-device-id') ?? undefined,
          // Stamped at insert so the retention sweep has something to act on.
          // Past this the reservation is swept and an identical retry runs for
          // real, which is why the window must outlast the mobile client's
          // offline retry horizon.
          expiresAt: new Date(Date.now() + this.retentionHours * 3600 * 1000),
        },
      });
    } catch {
      // Lost the race against a concurrent identical request.
      throw new ConflictException('An identical request is still in progress');
    }

    this.captureResponse(req, res, key, endpoint);
    next();
  }

  /**
   * Records the outcome once the handler has produced it.
   *
   * Only successful responses are stored: a failed command has not happened,
   * so a retry must be allowed to run rather than replay the error forever.
   */
  private captureResponse(req: Request, res: Response, key: string, endpoint: string): void {
    const originalJson = res.json.bind(res) as (body: unknown) => Response;

    res.json = (body: unknown): Response => {
      const status = res.statusCode;

      // The response is withheld until the outcome is recorded. Writing it in
      // the background instead lets a prompt client retry before the row is
      // updated and receive "still in progress" for a request that had already
      // succeeded — the exact race this middleware exists to prevent.
      void this.persistOutcome(key, endpoint, status, body).finally(() => originalJson(body));

      return res;
    };
  }

  private async persistOutcome(
    key: string,
    endpoint: string,
    status: number,
    body: unknown,
  ): Promise<void> {
    try {
      if (status >= 200 && status < 300) {
        await this.prisma.idempotencyKey.updateMany({
          where: { idempotencyKey: key, endpoint },
          data: { responseStatus: status, responseBody: body as never },
        });
        return;
      }

      // A failed command did not happen. Drop the reservation so a retry runs
      // for real instead of replaying the error forever.
      await this.prisma.idempotencyKey.deleteMany({
        where: { idempotencyKey: key, endpoint },
      });
    } catch {
      // Never fail a request over bookkeeping.
    }
  }
}
