import type { ExchangeState } from "@/features/transactions/api/types";

/**
 * Mirrors `Backend/src/modules/approval/dto/confirmation-response.dto.ts` and
 * `confirmation-request.dto.ts` exactly. `requestedToUserId`/`decidedBy` are
 * raw ids — no `/users/:id` endpoint exists to resolve names from (identity
 * module only implements auth).
 */
export const CONFIRMATION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const;
export type ConfirmationStatus = (typeof CONFIRMATION_STATUSES)[number];

export interface ConfirmationDecision {
  id: string;
  decision: "APPROVED" | "REJECTED";
  decidedBy: string;
  reason: string | null;
  decidedAt: string;
}

export interface Confirmation {
  id: string;
  confirmationNumber: string;
  exchangeId: string;
  exchangeNumber: string;
  exchangeStatus: ExchangeState;
  factoryId: string;
  status: ConfirmationStatus;
  requestedToUserId: string;
  requestedAt: string;
  dueAt: string | null;
  decidedAt: string | null;
  decisions: ConfirmationDecision[];
}

/** `GET /confirmations` returns the identical shape as `GET /confirmations/:id` — no separate list DTO. */
export type ConfirmationListItem = Confirmation;

/** Only the 4 params `ListConfirmationsQueryDto` actually declares. */
export interface ConfirmationListFilters {
  /** "all" sentinel = omit the param — same convention used everywhere else. */
  factoryId: string;
  /** "ALL" sentinel = omit the param — Docs 18 §15's 4 tabs map directly onto this. */
  status: ConfirmationStatus | "ALL";
  page: number;
  pageSize: number;
}

export interface PagedConfirmations {
  items: ConfirmationListItem[];
  page: number;
  pageSize: number;
  total: number;
  /** Computed generically by `ResponseFormatInterceptor` for every `@Paginated()` route, not a field the confirmation DTO declares itself. */
  totalPages: number;
}
