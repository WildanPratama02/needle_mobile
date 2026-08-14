import { Module } from '@nestjs/common';

import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';

/**
 * One of the twelve domain modules in Docs/19 §2, which maps it to
 * "query/read audit log — writing happens through AuditLogInterceptor".
 *
 * Read side only, by design: the interceptor is the sole writer.
 */
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
