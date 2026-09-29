import { Global, Module } from '@nestjs/common';

import { IdempotencyStore } from './idempotency-store';

/** Global: the middleware is applied in `AppModule`, the sync engine lives in a domain module. */
@Global()
@Module({
  providers: [IdempotencyStore],
  exports: [IdempotencyStore],
})
export class IdempotencyModule {}
