import { Module } from '@nestjs/common';

import {
  EmployeeController,
  ExchangeTypeController,
  FactoryController,
  LocationController,
  NeedleTypeController,
  TrolleyController,
} from './controllers/master-data.controller';
import { MasterDataService } from './services/master-data.service';

/**
 * One of the twelve domain modules in Docs/19 §2 — the reference data every
 * other module points at by foreign key.
 *
 * Read side only for now. Exposing the catalogue is what lets the clients show
 * names instead of ids; editing it is a separate spec that needs
 * `CHANGE_MASTER` audit wiring first.
 */
@Module({
  controllers: [
    FactoryController,
    LocationController,
    TrolleyController,
    NeedleTypeController,
    ExchangeTypeController,
    EmployeeController,
  ],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
