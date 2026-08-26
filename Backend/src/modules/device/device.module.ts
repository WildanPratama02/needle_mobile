import { Module } from '@nestjs/common';

import { DeviceController } from './controllers/device.controller';
import { DeviceService } from './services/device.service';

/**
 * One of the twelve domain modules named in `Backend/CLAUDE.md` §3, empty
 * until `.scratch/device-and-inventory/spec.md` (GAP-13 Phase 1) gave it its
 * first routes. Full lifecycle — register, activate, reassign, revoke, list,
 * detail — because a device carries no stock risk, unlike this same spec's
 * read-only `InventoryModule` addition.
 */
@Module({
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
