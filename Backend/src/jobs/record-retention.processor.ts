import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { RETENTION_QUEUE } from './retention.constants';
import { RetentionService, RetentionSweepResult } from './retention.service';

/**
 * Periodically clears expired idempotency keys and refresh tokens.
 *
 * A repeating sweep rather than a timer per record, for the same reason the
 * confirmation-expiry job is: a sweep collects anything that fell due while
 * the worker was down, whereas a per-row timer lost to a restart would leave
 * that row behind forever.
 */
@Processor(RETENTION_QUEUE)
export class RecordRetentionProcessor extends WorkerHost {
  private readonly logger = new Logger(RecordRetentionProcessor.name);

  constructor(private readonly retention: RetentionService) {
    super();
  }

  async process(): Promise<RetentionSweepResult> {
    const result = await this.retention.sweep();

    if (result.idempotencyKeys > 0 || result.refreshTokens > 0) {
      this.logger.log(
        `Retention sweep removed ${result.idempotencyKeys} idempotency key(s) and ${result.refreshTokens} refresh token(s)`,
      );
    }

    return result;
  }
}
