import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details: string[] };
  meta: { requestId: string };
}

function build(requestId = 'req-1') {
  const json = jest.fn<unknown, [ErrorEnvelope]>();
  const status = jest.fn().mockReturnValue({ json });

  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ requestId, method: 'POST', originalUrl: '/api/v1/exchanges' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;

  return { filter: new HttpExceptionFilter(), host, status, json };
}

describe('HttpExceptionFilter', () => {
  it.each([
    [new BadRequestException('bad'), 400, 'VALIDATION_ERROR'],
    [new UnauthorizedException('nope'), 401, 'UNAUTHORIZED'],
    [new ForbiddenException('no'), 403, 'FORBIDDEN'],
    [new NotFoundException('gone'), 404, 'NOT_FOUND'],
    [new ConflictException('clash'), 409, 'CONFLICT'],
    [new UnprocessableEntityException('nope'), 422, 'UNPROCESSABLE_ENTITY'],
    [new ServiceUnavailableException('down'), 503, 'SERVICE_UNAVAILABLE'],
  ])('maps %#: status %i to code %s', (exception, expectedStatus, expectedCode) => {
    const { filter, host, status, json } = build();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json.mock.calls[0][0].error.code).toBe(expectedCode);
  });

  it('shapes the body per Docs/12 §7', () => {
    const { filter, host, json } = build('trace-7');

    filter.catch(new NotFoundException('Exchange not found'), host);

    expect(json.mock.calls[0][0]).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Exchange not found', details: [] },
      meta: { requestId: 'trace-7' },
    });
  });

  // ValidationPipe reports field errors as a string array.
  it('moves validation messages into details', () => {
    const { filter, host, json } = build();

    filter.catch(
      new BadRequestException({
        message: ['password should not be empty', 'username must be a string'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      host,
    );

    const body = json.mock.calls[0][0];
    expect(body.error.details).toEqual([
      'password should not be empty',
      'username must be a string',
    ]);
    expect(body.error.message).toBe('Bad Request');
  });

  it('returns 500 with a generic message for a non-HTTP error', () => {
    const { filter, host, status, json } = build();

    filter.catch(new Error('connection string is postgres://user:hunter2@db'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0].error).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    });
  });

  // The message above contains a credential; it must not reach the client.
  it('never leaks an internal error message', () => {
    const { filter, host, json } = build();

    filter.catch(new Error('hunter2'), host);

    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('hunter2');
  });

  it('still emits an envelope when no request id was resolved', () => {
    const json = jest.fn<unknown, [ErrorEnvelope]>();
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/x' }),
        getResponse: () => ({ status: jest.fn().mockReturnValue({ json }) }),
      }),
    } as unknown as ArgumentsHost;

    new HttpExceptionFilter().catch(new NotFoundException('x'), host);

    expect(json.mock.calls[0][0].meta.requestId).toBe('');
  });
});
