import { Module } from '@nestjs/common';

import { ObjectStorageModule } from '../../integrations/object-storage/object-storage.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { CountSessionController } from './controllers/count-session.controller';
import { InventoryHistoryController } from './controllers/inventory-history.controller';
import { InventoryController } from './controllers/inventory.controller';
import { AdjustmentEvidenceService } from './services/adjustment-evidence.service';
import { CountSessionService } from './services/count-session.service';
import { InventoryHistoryService } from './services/inventory-history.service';
import { InventoryService } from './services/inventory.service';

/**
 * Stock Overview, Stock Movement, Receiving, Transfer, Return, Adjustment,
 * Physical Count (`.scratch/inventory/spec.md`,
 * `.scratch/inventory-operation-history/spec.md`).
 *
 * Imports `ExchangeModule` for its exported `NumberSequenceService` — movement
 * numbers share the one `MOVEMENT` daily counter already used by
 * `ExchangeService` for `ISSUE`/`REVERSAL` rows, so every `StockMovement`
 * across both modules numbers from the same continuous sequence.
 * `ObjectStorageModule` holds adjustment evidence files.
 */
@Module({
  imports: [ExchangeModule, ObjectStorageModule],
  controllers: [InventoryController, InventoryHistoryController, CountSessionController],
  providers: [
    InventoryService,
    InventoryHistoryService,
    AdjustmentEvidenceService,
    CountSessionService,
  ],
})
export class InventoryModule {}
