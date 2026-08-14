import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { NotificationService } from '../modules/notification/notification.service';
import { NOTIFICATION_QUEUE } from './notification.constants';

interface DispatchJobData {
  notificationId: string;
}

/**
 * Sends queued WhatsApp notifications off the request path (ticket 08).
 *
 * Retries are BullMQ's — three attempts with exponential backoff per Docs/14
 * §10. The row is only marked FAILED on the last attempt, so an intermittent
 * provider outage does not permanently mark a notification dead.
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDispatchProcessor.name);

  constructor(private readonly notifications: NotificationService) {
    super();
  }

  async process(job: Job<DispatchJobData>): Promise<void> {
    const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

    try {
      await this.notifications.dispatch(job.data.notificationId, finalAttempt);
    } catch (error) {
      this.logger.warn(
        `Notification ${job.data.notificationId} attempt ${job.attemptsMade + 1} failed: ${
          (error as Error).message
        }`,
      );
      throw error;
    }
  }
}
