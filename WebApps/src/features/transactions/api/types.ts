/**
 * Mirrors the REAL, code-verified contract — not Docs/12's aspirational one.
 * Source of truth for every field below:
 *   Backend/src/modules/exchange/dto/exchange-response.dto.ts (ExchangeResponseDto)
 *   Backend/src/modules/exchange/dto/exchange-request.dto.ts (ListExchangesQueryDto)
 *   Backend/prisma/schema.prisma (enum ExchangeState — 12 values)
 *   Backend/src/common/dto/api-response.dto.ts (envelope)
 *
 * Deliberately absent: any operator/PIC/exchange-type/needle-type *name*,
 * confirmation status, sync status. `EXCHANGE_CONTEXT_INCLUDE`
 * (exchange.repository.ts) doesn't join those relations into the response,
 * so there is nothing real to type here for them — see the Exchange
 * Transactions contract-gap notes for what's missing and why.
 */

export const EXCHANGE_STATES = [
  "CREATED",
  "OPERATOR_IDENTIFIED",
  "NEEDLE_SELECTED",
  "EXCHANGE_TYPE_SELECTED",
  "FRAGMENT_CHECK",
  "CONFIRMATION_PENDING",
  "EVIDENCE_CAPTURED",
  "NEW_NEEDLE_SELECTED",
  "NEEDLE_ISSUED",
  "USED_NEEDLE_STORED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ExchangeState = (typeof EXCHANGE_STATES)[number];

export interface ExchangeListItem {
  id: string;
  exchangeNumber: string;
  status: ExchangeState;
  factoryId: string;
  trolleyId: string;
  deviceId: string;
  operatorId: string | null;
  exchangeTypeId: string | null;
  oldNeedleTypeId: string | null;
  newNeedleTypeId: string | null;
  fragmentStatus: "FOUND" | "NOT_FOUND" | null;
  confirmationId: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

/** Only the 5 params `ListExchangesQueryDto` actually declares. */
export interface ExchangeListFilters {
  /** "all" sentinel = omit the param — same convention as Dashboard's factory filter. */
  factoryId: string;
  /** Free text, not a select — no `/trolleys` endpoint exists to source real names from (Backend/src/modules/master-data is an empty placeholder). "" = omit the param. */
  trolleyId: string;
  /** "ALL" sentinel = omit the param. */
  status: ExchangeState | "ALL";
  /** 1-based, matches the API. */
  page: number;
  pageSize: number;
}

export interface PagedExchanges {
  items: ExchangeListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  requestId: string;
}

/** `GET /exchanges/:id` returns the identical `ExchangeResponseDto` as the list — no extra detail fields. */
export type ExchangeDetail = ExchangeListItem;

/**
 * `Backend/src/modules/exchange/dto/evidence.dto.ts` (`EvidenceListItemDto`),
 * source of `GET /exchanges/:id/evidence`. `url` is a short-lived presigned
 * read URL — null until the upload has actually succeeded.
 */
export interface EvidenceItem {
  id: string;
  exchangeId: string;
  evidenceType: "OLD_NEEDLE" | "BROKEN_FRAGMENT" | "OTHER";
  storageKey: string;
  status: "PENDING" | "UPLOADED" | "FAILED";
  fileName: string | null;
  mimeType: string;
  checksum: string | null;
  capturedAt: string;
  uploadedAt: string | null;
  url: string | null;
}
