import { apiClient, type ApiSuccessBody } from "@/core/api/client";
import type { Employee } from "@/core/master-data";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "./employee-types";

/**
 * The write half of `/employees` — reads stay in `core/master-data`
 * (`fetchMasterData("employees", ...)`), this only adds the two routes that
 * module never had. Verified against
 * `Backend/src/modules/employee/controllers/employee.controller.ts`.
 */

/** `POST /employees` — `MASTER_EDIT`, 201. 409 on a duplicate `employeeNumber`, or on `rfidUid` already ACTIVE elsewhere (whole request rolls back). */
export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { data } = await apiClient.post<ApiSuccessBody<Employee>>("/employees", input);
  return data.data;
}

/** `PATCH /employees/:id` — `MASTER_EDIT`. `name`/`department`/`status` only; setting `status: INACTIVE` auto-revokes the active RFID card, if any. */
export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const { data } = await apiClient.patch<ApiSuccessBody<Employee>>(`/employees/${id}`, input);
  return data.data;
}
