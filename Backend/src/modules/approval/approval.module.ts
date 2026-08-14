import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import {
  CONFIRMATION_EXPIRY_JOB,
  CONFIRMATION_EXPIRY_QUEUE,
  ConfirmationExpiryProcessor,
} from '../../jobs/confirmation-expiry.processor';
import { NotificationModule } from '../notification/notification.module';
import { ConfirmationController } from './controllers/confirmation.controller';
import { ConfirmationService } from './services/confirmation.service';

/** How often the expiry sweep runs. Minute-level precision is ample for a TTL measured in hours. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

@Module({
  imports: [
    ConfigModule,
    NotificationModule,
    BullModule.registerQueue({ name: CONFIRMATION_EXPIRY_QUEUE }),
  ],
  controllers: [ConfirmationController],
  providers: [ConfirmationService, ConfirmationExpiryProcessor],
  exports: [ConfirmationService],
})
export class ApprovalModule implements OnModuleInit {
  private readonly logger = new Logger(ApprovalModule.name);

  constructor(
    @InjectQueue(CONFIRMATION_EXPIRY_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  /**
   * Registers the repeating sweep. A fixed job id keeps repeated boots from
   * stacking duplicate schedules.
   *
   * A Redis failure is logged rather than thrown: confirmations expiring late
   * is a degraded state, but refusing to start the API — and with it every
   * exchange on the factory floor — would be worse.
   */
  async onModuleInit(): Promise<void> {
    const ttlHours = this.config.get<number>('domain.confirmationTtlHours', 24);

    try {
      // BullMQ v6: repeating work is a job scheduler, and upsert by a stable
      // id means repeated boots update one schedule instead of stacking.
      await this.queue.upsertJobScheduler(
        CONFIRMATION_EXPIRY_JOB,
        { every: SWEEP_INTERVAL_MS },
        {
          name: CONFIRMATION_EXPIRY_JOB,
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      );

      this.logger.log(
        `Confirmation expiry sweep scheduled every ${SWEEP_INTERVAL_MS / 60000} min (TTL ${ttlHours}h)`,
      );
    } catch (error) {
      this.logger.error(
        `Could not schedule the confirmation expiry sweep: ${(error as Error).message}`,
      );
    }
  }
}
