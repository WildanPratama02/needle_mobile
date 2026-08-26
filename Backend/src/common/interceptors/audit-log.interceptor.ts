import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Observable, concatMap } from 'rxjs';

import { PrismaService } from '../../database/prisma.service';
import { AUDIT_KEY, AuditEvent } from '../decorators/audit.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RequestWithContext } from '../interfaces/request-context.interface';

/** Fields worth keeping from a response; the rest is noise or duplication. */
const SNAPSHOT_FIELDS = [
  'id',
  'status',
  'exchangeNumber',
  'confirmationNumber',
  'exchangeId',
  'factoryId',
  'trolleyId',
  'operatorId',
  'newNeedleTypeId',
  'fragmentStatus',
  'cancelledAt',
  'completedAt',
  // Inventory writes (Receiving/Transfer/Adjustment) — movementNumber doubles
  // as the entity id there is no separate row for; the quantity fields are
  // what an auditor actually wants to see for a ledger change.
  'movementId',
  'movementNumber',
  'transferId',
  'outMovementNumber',
  'inMovementNumber',
  'quantity',
  'balanceQuantity',
  'sourceBalanceQuantity',
  'destinationBalanceQuantity',
  'systemQuantity',
  'actualQuantity',
  'varianceQuantity',
  'locationId',
  'sourceLocationId',
  'destinationLocationId',
  'needleTypeId',
  // Device lifecycle (`.scratch/device-and-inventory/spec.md`) — `deviceCode`
  // is the human-readable identifier an auditor actually recognizes;
  // `factoryId`/`trolleyId` above already double as the reassign diff's
  // "after" side.
  'deviceCode',
];

/**
 * Writes an `audit_logs` row for every route carrying `@Audit(...)`.
 *
 * Central by design: Backend/CLAUDE.md §5 requires the interceptor and
 * forbids per-service logging, so adding an audited action is one decorator
 * rather than a code change inside a transaction.
 *
 * **Timing.** Being an interceptor, this runs after the handler's transaction
 * has committed — the audit row is a separate write, not part of the same
 * atomic unit. `Docs/12` §/issue sketches "Create Audit" inside the issue
 * transaction; that cannot hold together with CLAUDE.md §5, and the binding
 * project rule wins. The practical exposure is narrow and one-directional: a
 * committed action could in principle miss its audit row if the audit write
 * itself fails, but no audit row can ever describe an action that was rolled
 * back, since the interceptor only fires on a successful response.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const event = this.reflector.getAllAndOverride<AuditEvent>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!event) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;
    const paramId = (request.params as Record<string, string> | undefined)?.id;

    return next.handle().pipe(
      // The audit row is written before the response is released. Doing it in
      // the background would let a caller observe a committed action whose
      // audit trail has not landed yet — and a trail that arrives "eventually"
      // is not a trail. Errors skip this entirely, so a rejected transition
      // leaves no row.
      concatMap(async (body: unknown) => {
        await this.record(event, body, user, request, paramId);
        return body;
      }),
    );
  }

  private async record(
    event: AuditEvent,
    body: unknown,
    user: AuthenticatedUser | undefined,
    request: RequestWithContext,
    paramId: string | undefined,
  ): Promise<void> {
    try {
      const snapshot = AuditLogInterceptor.snapshot(body);

      await this.prisma.auditLog.create({
        data: {
          action: event.action,
          entityType: event.entityType,
          // Inventory writes (Receiving/Adjustment key on `movementId`,
          // Transfer on `transferId` for its paired OUT/IN rows) carry no
          // `id` field and their routes carry no `:id` param — without this,
          // every RECEIVE_STOCK/TRANSFER_STOCK/ADJUST_STOCK row would land
          // with entityId null, breaking the [entityType, entityId] lookup.
          entityId:
            (snapshot.id as string) ??
            (snapshot.movementId as string) ??
            (snapshot.transferId as string) ??
            paramId,
          actorUserId: user?.id,
          actorDeviceId: undefined,
          factoryId: (snapshot.factoryId as string) ?? undefined,
          // Same value the response envelope quotes, so a client's trace id
          // links its response to this row.
          requestId: request.requestId ?? request.header('x-request-id') ?? undefined,
          // `beforeData` stays null: an interceptor sees only the response.
          // Capturing the prior state would mean services logging their own
          // changes, which CLAUDE.md §5 rules out.
          afterData: snapshot as Prisma.InputJsonValue,
          metadata: {
            method: request.method,
            path: request.originalUrl.split('?')[0],
            deviceId: request.header('x-device-id') ?? null,
            // A free-text reason (e.g. Device activate/revoke's optional
            // note) lives on the request, not the response, so it can never
            // reach `afterData` via `snapshot()` — captured here instead,
            // the one place this interceptor already reads the request.
            reason: (request.body as Record<string, unknown> | undefined)?.reason ?? null,
          },
        },
      });
    } catch (error) {
      // Never turn a successful business action into a failed response
      // because bookkeeping had a problem.
      this.logger.error(`Audit write failed for ${event.action}: ${(error as Error).message}`);
    }
  }

  /** Keeps identifiers and state, drops everything bulky or irrelevant. */
  private static snapshot(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const source = body as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const field of SNAPSHOT_FIELDS) {
      if (source[field] !== undefined) {
        result[field] = source[field];
      }
    }

    return result;
  }
}
