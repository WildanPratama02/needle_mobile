import { Module } from '@nestjs/common';

import { ExchangeModule } from '../exchange/exchange.module';
import { MobileController } from './controllers/mobile.controller';
import { BootstrapService } from './services/bootstrap.service';
import { SyncChangesService } from './services/sync-changes.service';
import { SyncService } from './services/sync.service';

/**
 * The tablet's bootstrap and offline sync (Docs/12 §18–19, Docs/15,
 * Docs/adr/0007) — one of the twelve domain modules in Backend/CLAUDE.md §3.
 *
 * It owns no business rule of its own: every queued step runs through
 * `ExchangeService`, and the idempotency table and audit writer are the
 * shared ones from `common/`.
 */
@Module({
  imports: [ExchangeModule],
  controllers: [MobileController],
  providers: [BootstrapService, SyncChangesService, SyncService],
})
export class SynchronizationModule {}
