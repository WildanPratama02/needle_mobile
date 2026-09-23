import { ConfirmationStatus, ExchangeState } from '@prisma/client';

import { DomainException } from '../../../src/common/errors/domain.exception';
import {
  exchangeNotFound,
  transitionRefused,
} from '../../../src/modules/exchange/services/exchange-errors';
import { InvalidTransitionError } from '../../../src/modules/exchange/services/exchange-state-machine';

describe('exchange error mapping', () => {
  it('maps a refused transition to 409 EXCHANGE_INVALID_STATE with the current state', () => {
    const error = transitionRefused(
      new InvalidTransitionError('ISSUE_NEEDLE', ExchangeState.CREATED, 'Out of step'),
      null,
    );

    expect(error).toBeInstanceOf(DomainException);
    expect(error.getStatus()).toBe(409);
    expect(error.code).toBe('EXCHANGE_INVALID_STATE');
    expect(error.context).toEqual({ currentState: 'CREATED', action: 'ISSUE_NEEDLE' });
  });

  it.each([ConfirmationStatus.PENDING, ConfirmationStatus.REJECTED, ConfirmationStatus.EXPIRED])(
    'names a %s confirmation hold EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED',
    (confirmationStatus) => {
      const error = transitionRefused(
        new InvalidTransitionError(
          'CAPTURE_EVIDENCE',
          ExchangeState.CONFIRMATION_PENDING,
          'Waiting for approval',
        ),
        confirmationStatus,
      );

      expect(error.getStatus()).toBe(409);
      expect(error.code).toBe('EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED');
      expect(error.context).toMatchObject({ confirmationStatus });
    },
  );

  it('keeps EXCHANGE_INVALID_STATE for an approved confirmation refused for another reason', () => {
    const error = transitionRefused(
      new InvalidTransitionError('ISSUE_NEEDLE', ExchangeState.CONFIRMATION_PENDING, 'Out of step'),
      ConfirmationStatus.APPROVED,
    );

    expect(error.code).toBe('EXCHANGE_INVALID_STATE');
  });

  it('maps a missing exchange to 404 EXCHANGE_NOT_FOUND', () => {
    const error = exchangeNotFound('abc');

    expect(error.getStatus()).toBe(404);
    expect(error.code).toBe('EXCHANGE_NOT_FOUND');
  });
});
