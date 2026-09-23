import { Global, Module } from '@nestjs/common';

import { AuditWriter } from './audit-writer';

/**
 * Global for the same reason as `PrismaModule`: the interceptor is registered
 * in `AppModule` and the sync engine lives in a domain module, and both need
 * the single writer.
 */
@Global()
@Module({
  providers: [AuditWriter],
  exports: [AuditWriter],
})
export class AuditWriterModule {}
