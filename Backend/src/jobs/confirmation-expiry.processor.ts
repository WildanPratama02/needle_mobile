import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { ConfirmationService } from '../modules/approval/services/confirmation.service';

export const CONFIRMATION_EXPIRY_QUEUE = 'confirmation-expiry';
export const CONFIRMATION_EXPIRY_JOB = 'sweep';

/**
 * Flips overdue PENDING confirmations to EXPIRED (spec decision 1).
 *
 * A repeating sweep rather than a delayed job per confirmation: a sweep
 * catches anything that fell due while the worker was down, whereas a
 * per-confirmation timer lost to a restart would leave an exchange pending
 * forever.
 *
 * Runs out of the request path entirely — BullMQ on Redis, per the stack
 * decision in Backend/CLAUDE.md §6.
 */
@Processor(CONFIRMATION_EXPIRY_QUEUE)
export class ConfirmationExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(ConfirmationExpiryProcessor.name);

  constructor(private readonly confirmations: ConfirmationService) {
    super();
  }

  async process(): Promise<{ expired: number }> {
    const expired = await this.confirmations.expireOverdue();

    if (expired > 0) {
      this.logger.log(`Expired ${expired} overdue confirmation(s)`);
    }

    return { expired };
  }
}
