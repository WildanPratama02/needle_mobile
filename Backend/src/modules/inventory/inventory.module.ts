import { Module } from '@nestjs/common';

import { ExchangeModule } from '../exchange/exchange.module';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';

/**
 * Stock Overview, Stock Movement, Receiving, Transfer, Adjustment
 * (`.scratch/inventory/spec.md`).
 *
 * Imports `ExchangeModule` for its exported `NumberSequenceService` — movement
 * numbers share the one `MOVEMENT` daily counter already used by
 * `ExchangeService` for `ISSUE`/`REVERSAL` rows, so every `StockMovement`
 * across both modules numbers from the same continuous sequence.
 */
@Module({
  imports: [ExchangeModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
