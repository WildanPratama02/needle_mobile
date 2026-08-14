import { Request } from 'express';

import { AuthenticatedUser } from './authenticated-user.interface';

/**
 * What the pipeline attaches to a request as it travels.
 *
 * `requestId` is set once by `RequestIdMiddleware` so the response envelope,
 * the audit row and the error body all quote the same value — a client that
 * sends `X-Request-ID` (Docs/12 §5) can correlate all three.
 */
export interface RequestWithContext extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}
