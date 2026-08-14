import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { WhatsAppModule } from '../../integrations/whatsapp/whatsapp.module';
import { NotificationDispatchProcessor } from '../../jobs/notification-dispatch.processor';
import { NOTIFICATION_QUEUE } from '../../jobs/notification.constants';
import { NotificationService } from './notification.service';

/**
 * Outbound notification dispatch.
 *
 * Depends on no domain module, so `exchange` and `approval` can both import it
 * without a cycle.
 */
@Module({
  imports: [WhatsAppModule, BullModule.registerQueue({ name: NOTIFICATION_QUEUE })],
  providers: [NotificationService, NotificationDispatchProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
