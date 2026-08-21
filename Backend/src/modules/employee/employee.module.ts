import { Module } from '@nestjs/common';

import { RfidModule } from '../rfid/rfid.module';
import { EmployeeController } from './controllers/employee.controller';
import { EmployeeService } from './services/employee.service';

/**
 * One of the twelve domain modules in Docs/19 §2. Imports `RfidModule` for
 * `RfidCardService` — the inline enroll on create and the deactivate cascade
 * both call it rather than duplicating its rules
 * (`.scratch/master-data-storage-rfid/spec.md` decisions #12-#13).
 */
@Module({
  imports: [RfidModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
