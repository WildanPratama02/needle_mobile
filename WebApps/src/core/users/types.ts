/**
 * Mirrors `Backend/src/modules/identity/dto/user-response.dto.ts`.
 *
 * A separate shape from `MasterDataRow` on purpose: `username` is this row's
 * short identifier (its `code` analogue) but the field is named as the domain
 * names it, same reasoning as `Employee.employeeNumber` in `core/master-data`.
 */
export interface UserRow {
  id: string;
  username: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  roles: string[];
  factoryIds: string[];
}
