import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';

import { ResponseFormatInterceptor } from '../../../src/common/interceptors/response-format.interceptor';

interface Envelope {
  success: true;
  data: unknown;
  meta: {
    requestId: string;
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

function build(options: { paginated?: boolean; requestId?: string; statusCode?: number } = {}) {
  const reflector = { getAllAndOverride: () => options.paginated } as unknown as Reflector;

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ requestId: options.requestId ?? 'req-1' }),
      getResponse: () => ({ statusCode: options.statusCode ?? 200 }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;

  return { interceptor: new ResponseFormatInterceptor(reflector), context };
}

const handler = (body: unknown): CallHandler => ({ handle: () => of(body) });

describe('ResponseFormatInterceptor', () => {
  it('wraps an object in the Docs/12 §7 envelope', async () => {
    const { interceptor, context } = build();

    const result = (await firstValueFrom(
      interceptor.intercept(context, handler({ id: 'e-1', status: 'CREATED' })),
    )) as Envelope;

    expect(result).toEqual({
      success: true,
      data: { id: 'e-1', status: 'CREATED' },
      meta: { requestId: 'req-1' },
    });
  });

  it('carries the resolved request id', async () => {
    const { interceptor, context } = build({ requestId: 'trace-9' });

    const result = (await firstValueFrom(interceptor.intercept(context, handler({})))) as Envelope;

    expect(result.meta.requestId).toBe('trace-9');
  });

  it('wraps a bare array as data without pagination meta', async () => {
    const { interceptor, context } = build();

    const result = (await firstValueFrom(
      interceptor.intercept(context, handler([{ id: 'a' }, { id: 'b' }])),
    )) as Envelope;

    expect(result.data).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.meta).toEqual({ requestId: 'req-1' });
  });

  describe('paginated routes', () => {
    it('lifts items into data and counters into meta', async () => {
      const { interceptor, context } = build({ paginated: true });

      const result = (await firstValueFrom(
        interceptor.intercept(
          context,
          handler({ items: [{ id: 'a' }], total: 100, page: 1, pageSize: 20 }),
        ),
      )) as Envelope;

      expect(result.data).toEqual([{ id: 'a' }]);
      expect(result.meta).toEqual({
        requestId: 'req-1',
        page: 1,
        pageSize: 20,
        total: 100,
        totalPages: 5,
      });
    });

    it('rounds totalPages up on a partial last page', async () => {
      const { interceptor, context } = build({ paginated: true });

      const result = (await firstValueFrom(
        interceptor.intercept(context, handler({ items: [], total: 101, page: 1, pageSize: 20 })),
      )) as Envelope;

      expect(result.meta.totalPages).toBe(6);
    });

    it('reports zero pages for an empty result', async () => {
      const { interceptor, context } = build({ paginated: true });

      const result = (await firstValueFrom(
        interceptor.intercept(context, handler({ items: [], total: 0, page: 1, pageSize: 20 })),
      )) as Envelope;

      expect(result.meta.totalPages).toBe(0);
    });
  });

  // Docs/12 §8: 204 is "success without body".
  it('leaves a 204 response untouched', async () => {
    const { interceptor, context } = build({ statusCode: 204 });

    const result = await firstValueFrom(interceptor.intercept(context, handler(undefined)));

    expect(result).toBeUndefined();
  });

  it('leaves an undefined payload untouched on any status', async () => {
    const { interceptor, context } = build();

    const result = await firstValueFrom(interceptor.intercept(context, handler(undefined)));

    expect(result).toBeUndefined();
  });
});
