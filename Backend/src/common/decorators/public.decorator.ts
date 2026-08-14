import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of authentication. Authentication is on by default (the
 * guard is registered globally), so forgetting this decorator fails closed —
 * the route simply demands a token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
