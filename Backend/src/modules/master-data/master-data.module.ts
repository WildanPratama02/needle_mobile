import { Module } from '@nestjs/common';

import {
  ExchangeTypeController,
  FactoryController,
  LocationController,
  NeedleTypeController,
  StorageMappingController,
  TrolleyController,
} from './controllers/master-data.controller';
import { MasterDataService } from './services/master-data.service';

/**
 * One of the twelve domain modules in Docs/19 §2 — the reference data every
 * other module points at by foreign key.
 *
 * Mostly read side — exposing the catalogue is what lets the clients show
 * names instead of ids. `StorageMappingController` is this module's first
 * write path (`.scratch/master-data-storage-rfid`), gated on `MASTER_EDIT`
 * and audited via `CHANGE_MASTER`. `Employee` moved out entirely — its
 * controller and service now live in the `employee` module (decision #15).
 */
@Module({
  controllers: [
    FactoryController,
    LocationController,
    TrolleyController,
    NeedleTypeController,
    ExchangeTypeController,
    StorageMappingController,
  ],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
