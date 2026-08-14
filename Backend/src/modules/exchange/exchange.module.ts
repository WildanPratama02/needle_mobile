import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ObjectStorageModule } from '../../integrations/object-storage/object-storage.module';
import { NotificationModule } from '../notification/notification.module';
import { EvidenceController } from './controllers/evidence.controller';
import { ExchangeController } from './controllers/exchange.controller';
import { ExchangeRepository } from './repositories/exchange.repository';
import { EvidenceService } from './services/evidence.service';
import { ExchangeService } from './services/exchange.service';
import { NumberSequenceService } from './services/number-sequence.service';

/**
 * The needle exchange workflow.
 *
 * `NumberSequenceService` is exported because issue 06 needs confirmation
 * numbers and issue 09 needs movement numbers from the same daily counters.
 */
@Module({
  // Evidence storage arrives through the port, so this module never names a
  // provider (Backend/CLAUDE.md §7).
  imports: [ConfigModule, ObjectStorageModule, NotificationModule],
  controllers: [ExchangeController, EvidenceController],
  providers: [ExchangeService, EvidenceService, ExchangeRepository, NumberSequenceService],
  exports: [ExchangeService, NumberSequenceService],
})
export class ExchangeModule {}
