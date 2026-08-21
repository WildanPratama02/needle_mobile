/**
 * Mirrors the real, code-verified contract in
 * `Backend/src/modules/rfid/{controllers,dto,services}` — `RfidController`/
 * `RfidCardResponseDto`. `RfidCard` has no `code`/`name` columns, so it does
 * not fit `core/master-data`'s `MasterDataRow` shape — this trio stays
 * outside that module
 * (`.scratch/master-data-storage-rfid/issues/07-webapps-rfid-screen.md`).
 */

export type EntityStatus = "ACTIVE" | "INACTIVE";

/** `RfidCardResponseDto`. */
export interface RfidCard {
  id: string;
  rfidUid: string;
  employeeId: string;
  status: EntityStatus;
  issuedAt: string;
  revokedAt: string | null;
}

/** Only the params `RfidCardQueryDto` actually declares. */
export interface RfidCardListFilters {
  /** "" = omit. */
  employeeId: string;
  /** "ALL" = omit — omitting the filter includes revoked cards too. */
  status: EntityStatus | "ALL";
  page: number;
  pageSize: number;
}

export interface PagedRfidCards {
  items: RfidCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** `EnrollRfidCardDto`. */
export interface EnrollRfidCardInput {
  employeeId: string;
  rfidUid: string;
}
