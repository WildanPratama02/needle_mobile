import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';

import { AUDIT_ACTIONS, AuditEvent } from '../../../src/common/decorators/audit.decorator';
import { AuditLogInterceptor } from '../../../src/common/interceptors/audit-log.interceptor';
import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';

interface AuditCreateCall {
  data: {
    action: string;
    entityType: string;
    entityId?: string;
    actorUserId?: string;
    factoryId?: string;
    requestId?: string;
    afterData: Record<string, unknown>;
    beforeData?: unknown;
  };
}

const USER: AuthenticatedUser = {
  id: 'user-1',
  username: 'pic',
  name: 'PIC',
  roles: ['PIC_TROLI'],
  permissions: [],
  factoryIds: ['factory-a'],
  locationIds: [],
};

function build(options: { event?: AuditEvent; headers?: Record<string, string> } = {}) {
  const create = jest.fn<Promise<unknown>, [AuditCreateCall]>().mockResolvedValue({});
  const reflector = {
    getAllAndOverride: () => options.event,
  } as unknown as Reflector;

  const request = {
    user: USER,
    params: { id: 'exchange-1' },
    method: 'POST',
    originalUrl: '/api/v1/exchanges?trace=1',
    header: (name: string) => options.headers?.[name.toLowerCase()],
  };

  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;

  const interceptor = new AuditLogInterceptor(reflector, {
    auditLog: { create },
  } as unknown as PrismaService);

  return { interceptor, context, create };
}

const handlerReturning = (body: unknown): CallHandler => ({ handle: () => of(body) });

const EXCHANGE_EVENT: AuditEvent = {
  action: AUDIT_ACTIONS.CREATE_EXCHANGE,
  entityType: 'Exchange',
};

describe('AuditLogInterceptor', () => {
  it('writes nothing for a route without @Audit', async () => {
    const { interceptor, context, create } = build();

    await firstValueFrom(interceptor.intercept(context, handlerReturning({ id: 'x' })));

    expect(create).not.toHaveBeenCalled();
  });

  it('records the action, entity and actor', async () => {
    const { interceptor, context, create } = build({ event: EXCHANGE_EVENT });

    await firstValueFrom(
      interceptor.intercept(
        context,
        handlerReturning({ id: 'exchange-9', factoryId: 'factory-a', status: 'CREATED' }),
      ),
    );

    expect(create.mock.calls[0][0].data).toMatchObject({
      action: AUDIT_ACTIONS.CREATE_EXCHANGE,
      entityType: 'Exchange',
      entityId: 'exchange-9',
      actorUserId: 'user-1',
      factoryId: 'factory-a',
    });
  });

  it('falls back to the route id when the body carries none', async () => {
    const { interceptor, context, create } = build({ event: EXCHANGE_EVENT });

    await firstValueFrom(interceptor.intercept(context, handlerReturning({ status: 'CANCELLED' })));

    expect(create.mock.calls[0][0].data.entityId).toBe('exchange-1');
  });

  it('carries the request id from the header (Docs/12 §5)', async () => {
    const { interceptor, context, create } = build({
      event: EXCHANGE_EVENT,
      headers: { 'x-request-id': 'req-42' },
    });

    await firstValueFrom(interceptor.intercept(context, handlerReturning({ id: 'e-1' })));

    expect(create.mock.calls[0][0].data.requestId).toBe('req-42');
  });

  it('snapshots only the identifying and state fields', async () => {
    const { interceptor, context, create } = build({ event: EXCHANGE_EVENT });

    await firstValueFrom(
      interceptor.intercept(
        context,
        handlerReturning({
          id: 'e-1',
          status: 'NEEDLE_ISSUED',
          newNeedleTypeId: 'needle-1',
          // Bulk that has no business in an audit row.
          evidence: [{ storageKey: 'a'.repeat(500) }],
          secret: 'should not be captured',
        }),
      ),
    );

    const after = create.mock.calls[0][0].data.afterData;
    expect(after).toEqual({ id: 'e-1', status: 'NEEDLE_ISSUED', newNeedleTypeId: 'needle-1' });
    expect(after).not.toHaveProperty('secret');
    expect(after).not.toHaveProperty('evidence');
  });

  // Only services can see prior state, and CLAUDE.md §5 forbids them logging.
  it('leaves beforeData unset', async () => {
    const { interceptor, context, create } = build({ event: EXCHANGE_EVENT });

    await firstValueFrom(interceptor.intercept(context, handlerReturning({ id: 'e-1' })));

    expect(create.mock.calls[0][0].data.beforeData).toBeUndefined();
  });

  // A rejected transition is not an action that happened.
  it('writes nothing when the handler fails', async () => {
    const { interceptor, context, create } = build({ event: EXCHANGE_EVENT });

    await expect(
      firstValueFrom(
        interceptor.intercept(context, { handle: () => throwError(() => new Error('409')) }),
      ),
    ).rejects.toThrow('409');

    expect(create).not.toHaveBeenCalled();
  });

  // Bookkeeping must never turn a successful action into a failed response.
  it('swallows an audit write failure', async () => {
    const { interceptor, context, create } = build({ event: EXCHANGE_EVENT });
    create.mockRejectedValue(new Error('audit table gone'));

    await expect(
      firstValueFrom(interceptor.intercept(context, handlerReturning({ id: 'e-1' }))),
    ).resolves.toBeDefined();
  });
});
