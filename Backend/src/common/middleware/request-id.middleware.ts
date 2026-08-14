import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';

import { RequestWithContext } from '../interfaces/request-context.interface';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Establishes one request id per request, honouring the client's
 * `X-Request-ID` when supplied (Docs/12 §5) and minting one otherwise.
 *
 * Resolved here rather than in each consumer so the envelope, the audit row
 * and any error body cannot disagree about which request they describe. It is
 * echoed back in the response header so a client that did not send one can
 * still quote it in a support ticket.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    const incoming = req.header(REQUEST_ID_HEADER)?.trim();

    req.requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, req.requestId);

    next();
  }
}
