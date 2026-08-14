"use client";

import {
  employeeColumns,
  exchangeTypeColumns,
  factoryColumns,
  needleTypeColumns,
  trolleyColumns,
} from "./columns";
import { MasterDataScreen } from "./master-data-screen";

/**
 * The five master-data screens. Each is the shared shell plus its columns.
 *
 * Storage / Needle Hole and RFID Card are deliberately absent — `/locations`
 * exists on the API but those screens are out of scope for this spec, and a
 * navigation entry pointing at a route that does not exist is worse than one
 * that is visibly unavailable.
 */

export function FactoryScreen() {
  return (
    <MasterDataScreen
      collection="factories"
      title="Factory"
      description="Sites you are scoped to."
      columns={factoryColumns}
      factoryScoped
      emptyTitle="No factories in your scope."
    />
  );
}

export function TrolleyScreen() {
  return (
    <MasterDataScreen
      collection="trolleys"
      title="Trolley"
      description="Trolleys on the factory floor. Each is its own inventory location (ADR-003)."
      columns={trolleyColumns}
      factoryScoped
      emptyTitle="No trolleys in your scope."
    />
  );
}

export function NeedleTypeScreen() {
  return (
    <MasterDataScreen
      collection="needle-types"
      title="Needle Type"
      description="The business-wide needle catalogue. Not specific to any factory."
      columns={needleTypeColumns}
      emptyTitle="No needle types found."
    />
  );
}

export function ExchangeTypeScreen() {
  return (
    <MasterDataScreen
      collection="exchange-types"
      title="Exchange Type"
      description="How an exchange is classified, and which classification requires a fragment check."
      columns={exchangeTypeColumns}
      emptyTitle="No exchange types found."
    />
  );
}

export function EmployeeScreen() {
  return (
    <MasterDataScreen
      collection="employees"
      title="Employee"
      description="Factory-floor operators, identified by RFID during an exchange."
      columns={employeeColumns}
      factoryScoped
      emptyTitle="No employees in your scope."
    />
  );
}
