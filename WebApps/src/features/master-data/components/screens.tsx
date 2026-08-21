"use client";

import {
  exchangeTypeColumns,
  factoryColumns,
  needleTypeColumns,
  trolleyColumns,
} from "./columns";
import { MasterDataScreen } from "./master-data-screen";

export { EmployeeScreen } from "./employee-screen";
export { RfidScreen } from "./rfid-screen";
export { StorageScreen } from "./storage-screen";

/**
 * Four of the seven master-data screens: each is the shared read-only shell
 * plus its columns. Employee, Storage / Needle Hole and RFID Card are
 * writable (`.scratch/master-data-storage-rfid/spec.md` decisions #5/#6/#10)
 * and are re-exported above from their own dedicated screen files instead —
 * the cross-cutting WebApps rule for that spec is "do not extend the
 * read-only `MasterDataScreen` shell with write slots."
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
