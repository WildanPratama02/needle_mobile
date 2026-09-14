"use client";

import { exchangeTypeColumns } from "./columns";
import { MasterDataScreen } from "./master-data-screen";

export { EmployeeScreen } from "./employee-screen";
export { RfidScreen } from "./rfid-screen";
export { StorageScreen } from "./storage-screen";
export { NeedleTypeScreen } from "./needle-type-screen";
export { FactoryScreen } from "./factory-screen";
export { TrolleyScreen } from "./trolley-screen";

/**
 * One of the seven master-data screens is still the shared read-only shell
 * plus its columns (Exchange Type — matches its contract, no write route
 * documented, ADR-0004). Employee, Storage / Needle Hole, RFID Card, Needle
 * Type, Factory and Trolley are all writable and are re-exported above from
 * their own dedicated screen files instead — the cross-cutting WebApps rule
 * is "do not extend the read-only `MasterDataScreen` shell with write
 * slots."
 */

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
