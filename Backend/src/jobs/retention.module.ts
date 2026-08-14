import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Queue } from 'bullmq';

import { RecordRetentionProcessor } from './record-retention.processor';
import { RETENTION_QUEUE, RETENTION_SWEEP_JOB } from './retention.constants';
import { RetentionService } from './retention.service';

/** Retention is measured in hours, so hourly collection is ample. */
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Storage housekeeping.
 *
 * Deliberately not a domain module — it owns no business concept, so making it
 * a thirteenth entry under `modules/` would misrepresent it and cut against
 * Backend/CLAUDE.md §7. It sits in `jobs/`, which Docs/19 designates for
 * background work, alongside the processor it schedules.
 */
@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: RETENTION_QUEUE })],
  providers: [RetentionService, RecordRetentionProcessor],
  exports: [RetentionService],
})
export class RetentionModule implements OnModuleInit {
  private readonly logger = new Logger(RetentionModule.name);

  constructor(@InjectQueue(RETENTION_QUEUE) private readonly queue: Queue) {}

  /**
   * A stable scheduler id means repeated boots update one schedule rather than
   * stacking duplicates. A Redis failure is logged, not thrown: rows accruing
   * is a slow degradation, while refusing to start the API is an outage.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.queue.upsertJobScheduler(
        RETENTION_SWEEP_JOB,
        { every: SWEEP_INTERVAL_MS },
        {
          name: RETENTION_SWEEP_JOB,
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      );

      this.logger.log(`Retention sweep scheduled every ${SWEEP_INTERVAL_MS / 60000} min`);
    } catch (error) {
      this.logger.error(`Could not schedule the retention sweep: ${(error as Error).message}`);
    }
  }
}
