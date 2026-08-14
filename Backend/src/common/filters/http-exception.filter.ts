import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { ApiErrorDto } from '../dto/api-response.dto';
import { RequestWithContext } from '../interfaces/request-context.interface';

/**
 * Stable machine-readable codes, derived from the status rather than invented
 * per throw site.
 *
 * Docs/12 §7's example shows a domain code (`EXCHANGE_NOT_FOUND`), which would
 * mean every throw carrying its own string. Deriving from the status keeps the
 * set closed and consistent; the human-readable `message` already says which
 * resource was involved. A route needing a domain-specific code can graduate to
 * one later without breaking this default.
 */
const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

interface NestExceptionBody {
  message?: string | string[];
  error?: string;
}

/**
 * Renders every failure in the error envelope from `Docs/12` §7.
 *
 * Catches everything, not just `HttpException`: an unhandled error would
 * otherwise escape as Nest's default JSON and be the one response shape that
 * does not match the contract.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, details } = HttpExceptionFilter.describe(exception);

    if (status >= 500) {
      // Unexpected failures need a stack in the log even though the client
      // only ever sees a generic message.
      this.logger.error(
        `${request.method} ${request.originalUrl} failed: ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
    }

    const body: ApiErrorDto = {
      success: false,
      error: {
        code: STATUS_CODES[status] ?? 'INTERNAL_ERROR',
        message,
        details,
      },
      meta: { requestId: request.requestId ?? '' },
    };

    response.status(status).json(body);
  }

  private static describe(exception: unknown): { message: string; details: string[] } {
    if (!(exception instanceof HttpException)) {
      // Never leak an internal error message or stack to a client.
      return { message: 'Internal server error', details: [] };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { message: payload, details: [] };
    }

    const body = payload as NestExceptionBody;

    // ValidationPipe reports field errors as a string array; those are the
    // `details` the envelope asks for, and the summary becomes the message.
    if (Array.isArray(body.message)) {
      return {
        message: body.error ?? 'Validation failed',
        details: body.message,
      };
    }

    return { message: body.message ?? exception.message, details: [] };
  }
}
