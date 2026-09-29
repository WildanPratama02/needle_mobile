import { HttpStatus } from '@nestjs/common';
import { ConfirmationStatus, ExchangeState } from '@prisma/client';

import { DomainException, ERROR_CODES } from '../../../common/errors/domain.exception';
import { InvalidTransitionError } from './exchange-state-machine';

/**
 * Maps a refused transition to the HTTP boundary: 409, since the request may
 * become valid once the exchange moves on.
 *
 * An exchange held at `CONFIRMATION_PENDING` gets its own code — the tablet
 * must tell "wait for the approver" apart from "you are out of step" (Docs/12
 * §24). One implementation, shared by every service that runs the state
 * machine.
 */
export function transitionRefused(
  error: InvalidTransitionError,
  confirmationStatus: ConfirmationStatus | null,
): DomainException {
  const context = { currentState: error.from, action: error.action };

  if (
    error.from === ExchangeState.CONFIRMATION_PENDING &&
    confirmationStatus !== ConfirmationStatus.APPROVED
  ) {
    return new DomainException(
      ERROR_CODES.EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED,
      error.message,
      HttpStatus.CONFLICT,
      { ...context, confirmationStatus },
    );
  }

  return new DomainException(
    ERROR_CODES.EXCHANGE_INVALID_STATE,
    error.message,
    HttpStatus.CONFLICT,
    context,
  );
}

export function exchangeNotFound(id: string): DomainException {
  return new DomainException(
    ERROR_CODES.EXCHANGE_NOT_FOUND,
    `Exchange ${id} not found`,
    HttpStatus.NOT_FOUND,
  );
}

export function insufficientStock(
  message: string,
  needleTypeId: string,
  availableQuantity: number,
  requestedQuantity: number,
): DomainException {
  return new DomainException(
    ERROR_CODES.INVENTORY_INSUFFICIENT_STOCK,
    message,
    HttpStatus.CONFLICT,
    { needleTypeId, availableQuantity, requestedQuantity },
  );
}
