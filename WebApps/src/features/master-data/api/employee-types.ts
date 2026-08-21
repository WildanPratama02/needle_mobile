/**
 * Employee's write shapes. Reads already fit `core/master-data`'s
 * `Employee`/`MasterDataRow` type (id/code/name/status + factoryId/
 * employeeNumber/department) — only the request DTOs are new, so this stays a
 * small write-only companion instead of a full types/data-source/queries
 * trio duplicating what `core/master-data` already reads.
 * `Backend/src/modules/employee/dto/employee-request.dto.ts`.
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/**
 * `CreateEmployeeDto`. `rfidUid` is optional inline enroll — same transaction
 * as the employee create (spec decision #12), same `RfidCardService.enroll`
 * code path the RFID Card screen's own enroll form uses.
 */
export interface CreateEmployeeInput {
  employeeNumber: string;
  name: string;
  department?: string;
  factoryId: string;
  rfidUid?: string;
}

/**
 * `UpdateEmployeeDto` — `employeeNumber`/`factoryId` deliberately absent,
 * not editable after creation (spec, "explicitly out of scope").
 */
export interface UpdateEmployeeInput {
  name?: string;
  department?: string;
  status?: EntityStatus;
}
