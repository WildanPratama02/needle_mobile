import { ConflictException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';

import { DomainException, ERROR_CODES } from '../errors/domain.exception';
import { IdempotencyStore } from '../idempotency/idempotency-store';
import { RequestWithContext } from '../interfaces/request-context.interface';

/**
 * Makes state-changing commands safe to retry (ADR-005 — mobile is offline
 * first and will resend).
 *
 * The first response for a key is stored and replayed verbatim on retry, so a
 * command never executes twice. The table itself is handled by
 * `IdempotencyStore`, which the mobile sync engine shares for its per-command
 * keys (Backend/CLAUDE.md §4 — one implementation).
 *
 * Scoped by (key, endpoint), not by key alone (round 4 Q7): mobile sends one
 * key per state transition, so the same key legitimately appears against
 * different endpoints.
 */
@Injectable()
export class IdempotencyKeyMiddleware implements NestMiddleware {
  constructor(private readonly store: IdempotencyStore) {}

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

    const claim = await this.store.claim({
      key,
      endpoint,
      requestHash: IdempotencyStore.hash(req.body),
      actorUserId: req.user?.id,
      deviceId: req.header('x-device-id') ?? undefined,
    });

    switch (claim.outcome) {
      case 'MISMATCH':
        throw new DomainException(
          ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
          'Idempotency-Key was already used with a different request body',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );

      case 'IN_PROGRESS':
        throw new ConflictException('An identical request is still in progress');

      case 'REPLAY':
        // Replay the original outcome, but stamp it with *this* request's id:
        // the caller needs its own trace id back, not the first caller's.
        res
          .status(claim.responseStatus)
          .json(IdempotencyKeyMiddleware.restamp(claim.responseBody, req.requestId));
        return;

      case 'CLAIMED':
        this.captureResponse(res, key, endpoint);
        next();
    }
  }

  /**
   * Records the outcome once the handler has produced it.
   *
   * Only successful responses are stored: a failed command has not happened,
   * so a retry must be allowed to run rather than replay the error forever.
   */
  private captureResponse(res: Response, key: string, endpoint: string): void {
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
        await this.store.complete(key, endpoint, status, body);
        return;
      }

      // A failed command did not happen. Drop the reservation so a retry runs
      // for real instead of replaying the error forever.
      await this.store.release(key, endpoint);
    } catch {
      // Never fail a request over bookkeeping.
    }
  }
}
