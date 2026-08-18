import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { NOTIFICATION_QUEUE } from '../../jobs/notification.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Operational probes. Not a domain module — see `HealthService` for why it
 * lives under `common/` rather than in `src/modules/`.
 *
 * It registers a queue purely to have something to ask Redis through; which
 * queue is arbitrary, since any of them proves the same backend is reachable.
 * `NOTIFICATION_QUEUE` is already registered by `NotificationModule`, so this
 * is a second handle to the same queue and costs one extra Redis connection.
 * That is the price of checking the queue backend at all — the alternative,
 * opening a client per probe, would cost a connection per request instead.
 */
@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATION_QUEUE })],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
