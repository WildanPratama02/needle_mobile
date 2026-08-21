import { Module } from '@nestjs/common';

import { RfidController } from './controllers/rfid.controller';
import { RfidCardService } from './services/rfid-card.service';

/**
 * One of the twelve domain modules in Docs/19 §2. Owns `RfidCard` enroll/
 * revoke for admin-desktop data entry. Exports `RfidCardService` so the
 * `employee` module can call `enroll`/`revokeActiveCardsForEmployee` without
 * duplicating either rule (`.scratch/master-data-storage-rfid/spec.md`
 * decisions #12-#13).
 */
@Module({
  controllers: [RfidController],
  providers: [RfidCardService],
  exports: [RfidCardService],
})
export class RfidModule {}
