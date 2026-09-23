import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, concatMap } from 'rxjs';

import { AuditWriter } from '../audit/audit-writer';
import { AUDIT_KEY, AuditEvent } from '../decorators/audit.decorator';
import { RequestWithContext } from '../interfaces/request-context.interface';

/**
 * Writes an `audit_logs` row for every route carrying `@Audit(...)`.
 *
 * Central by design: Backend/CLAUDE.md §5 requires the interceptor and
 * forbids per-service logging, so adding an audited action is one decorator
 * rather than a code change inside a transaction. The row itself is written by
 * `AuditWriter`, which the mobile sync engine shares — one audit
 * implementation, two entry points.
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
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditWriter,
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
        await this.audit.write({
          action: event.action,
          entityType: event.entityType,
          result: body,
          fallbackEntityId: paramId,
          actorUserId: user?.id,
          // Same value the response envelope quotes, so a client's trace id
          // links its response to this row.
          requestId: request.requestId ?? request.header('x-request-id') ?? undefined,
          metadata: {
            method: request.method,
            path: request.originalUrl.split('?')[0],
            deviceId: request.header('x-device-id') ?? null,
            // A free-text reason (e.g. Device activate/revoke's optional
            // note) lives on the request, not the response, so it can never
            // reach `afterData` via the snapshot — captured here instead,
            // the one place this interceptor already reads the request.
            reason: (request.body as Record<string, unknown> | undefined)?.reason ?? null,
          },
        });
        return body;
      }),
    );
  }
}
