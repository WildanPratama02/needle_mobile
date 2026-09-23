import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain error codes from `Docs/12` §23 that the codebase actually raises.
 *
 * The filter derives a code from the HTTP status by default. A failure a
 * client must branch on — the tablet's conflict screen above all (`Docs/15`
 * §13) — graduates to one of these instead: "invalid state" and "insufficient
 * stock" are both 409, and only the code tells them apart.
 */
export const ERROR_CODES = {
  EXCHANGE_NOT_FOUND: 'EXCHANGE_NOT_FOUND',
  EXCHANGE_INVALID_STATE: 'EXCHANGE_INVALID_STATE',
  EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED: 'EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED',
  INVENTORY_INSUFFICIENT_STOCK: 'INVENTORY_INSUFFICIENT_STOCK',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  DEVICE_CONTEXT_REQUIRED: 'DEVICE_CONTEXT_REQUIRED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_INACTIVE: 'DEVICE_INACTIVE',
  DEVICE_MISMATCH: 'DEVICE_MISMATCH',
  RFID_NOT_FOUND: 'RFID_NOT_FOUND',
  RFID_INACTIVE: 'RFID_INACTIVE',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  EMPLOYEE_INACTIVE: 'EMPLOYEE_INACTIVE',
  FACTORY_SCOPE_DENIED: 'FACTORY_SCOPE_DENIED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * An `HttpException` carrying a domain code and, optionally, structured facts
 * about the failure (`error.context` in the envelope).
 *
 * The HTTP status is still the caller's to choose, so graduating a throw site
 * to a domain code never changes the status a client already relies on.
 */
export class DomainException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly context?: Record<string, unknown>,
  ) {
    super({ message, code }, status);
  }
}
