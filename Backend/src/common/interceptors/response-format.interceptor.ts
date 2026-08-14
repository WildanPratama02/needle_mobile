import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

import { PAGINATED_KEY } from '../decorators/paginated.decorator';
import { ApiSuccessDto, PaginatedPayload } from '../dto/api-response.dto';
import { RequestWithContext } from '../interfaces/request-context.interface';

/**
 * Wraps every successful response in the envelope from `Docs/12` §7.
 *
 * Central so controllers keep returning plain payloads — the alternative is
 * every handler constructing its own envelope, which drifts the moment someone
 * forgets. `Backend/CLAUDE.md` §5 requires the contract to match Docs/12.
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();

    const isPaginated = this.reflector.getAllAndOverride<boolean>(PAGINATED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((payload: unknown) => {
        // 204 means "success without body" (Docs/12 §8). Wrapping would give
        // it a body and contradict the status.
        if (response.statusCode === 204 || payload === undefined) {
          return payload;
        }

        const requestId = request.requestId ?? '';

        if (isPaginated) {
          const paged = payload as PaginatedPayload<unknown>;
          const pageSize = paged.pageSize || 1;

          return {
            success: true,
            data: paged.items,
            meta: {
              requestId,
              page: paged.page,
              pageSize: paged.pageSize,
              total: paged.total,
              totalPages: Math.ceil(paged.total / pageSize),
            },
          } satisfies ApiSuccessDto<unknown[]>;
        }

        return {
          success: true,
          data: payload,
          meta: { requestId },
        } satisfies ApiSuccessDto;
      }),
    );
  }
}
