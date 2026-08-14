import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeState } from '@prisma/client';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { ExchangeRepository } from '../../../src/modules/exchange/repositories/exchange.repository';
import { ExchangeService } from '../../../src/modules/exchange/services/exchange.service';
import { InsufficientStockError } from '../../../src/modules/exchange/services/insufficient-stock.error';
import { NumberSequenceService } from '../../../src/modules/exchange/services/number-sequence.service';
import { NotificationService } from '../../../src/modules/notification/notification.service';

const FACTORY = 'factory-a';
const TROLLEY_LOCATION = 'trolley-location-1';
const NEEDLE_TYPE = 'needle-type-1';

const user: AuthenticatedUser = {
  id: 'pic-1',
  username: 'pic',
  name: 'PIC',
  roles: ['PIC_TROLI'],
  permissions: ['EXCHANGE_ISSUE'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const exchange = {
  id: 'exchange-1',
  factoryId: FACTORY,
  trolleyId: 'trolley-1',
  state: ExchangeState.NEW_NEEDLE_SELECTED,
  newNeedleTypeId: NEEDLE_TYPE,
  fragmentStatus: null,
  exchangeType: { code: 'BENT', requiresFragmentValidation: false },
  confirmation: null,
  evidence: [],
};

/**
 * `updateManyCount` drives the conditional decrement: 1 means stock was taken,
 * 0 means the compare-and-set found too little. `movementError` lets a test
 * raise something *inside* the transaction after the decrement succeeded.
 */
function build(options: { updateManyCount?: number; movementError?: Error } = {}) {
  const notifyExchangeStuck = jest.fn().mockResolvedValue(undefined);
  const stockMovementCreate = jest.fn().mockImplementation(() => {
    if (options.movementError) {
      return Promise.reject(options.movementError);
    }
    return Promise.resolve({});
  });

  const tx = {
    inventoryBalance: {
      updateMany: jest.fn().mockResolvedValue({ count: options.updateManyCount ?? 1 }),
    },
    stockMovement: { create: stockMovementCreate },
    exchange: {
      update: jest.fn().mockResolvedValue({}),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ ...exchange, state: 'NEEDLE_ISSUED' }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ last_value: 1 }]),
  };

  const prisma = {
    trolley: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'trolley-1',
        locationId: TROLLEY_LOCATION,
        factoryId: FACTORY,
      }),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const exchanges = { findWithContext: jest.fn().mockResolvedValue(exchange) };
  const numbers = { next: jest.fn().mockResolvedValue('MV-20260812-000001') };
  const config = { get: () => 24 } as unknown as ConfigService;

  const service = new ExchangeService(
    prisma as unknown as PrismaService,
    exchanges as unknown as ExchangeRepository,
    numbers as unknown as NumberSequenceService,
    config,
    { notifyExchangeStuck } as unknown as NotificationService,
  );

  return { service, notifyExchangeStuck, tx, stockMovementCreate };
}

describe('ExchangeService.issueNeedle — stock outcome', () => {
  it('issues successfully and sends no stuck notice', async () => {
    const { service, notifyExchangeStuck, tx } = build({ updateManyCount: 1 });

    await service.issueNeedle('exchange-1', { quantity: 1 }, user);

    expect(tx.inventoryBalance.updateMany).toHaveBeenCalled();
    expect(tx.stockMovement.create).toHaveBeenCalled();
    expect(notifyExchangeStuck).not.toHaveBeenCalled();
  });

  it('decrements only when the balance covers the request', async () => {
    const { service, tx } = build({ updateManyCount: 1 });

    await service.issueNeedle('exchange-1', { quantity: 3 }, user);

    // The `gte` guard is what makes the decrement a compare-and-set.
    expect(tx.inventoryBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ quantity: { gte: 3 } }) as unknown,
        data: { quantity: { decrement: 3 } },
      }),
    );
  });

  describe('insufficient stock', () => {
    it('maps the typed error to 409 at the boundary', async () => {
      const { service } = build({ updateManyCount: 0 });

      await expect(service.issueNeedle('exchange-1', { quantity: 5 }, user)).rejects.toThrow(
        ConflictException,
      );
    });

    it('names the location, needle type and requested amount', async () => {
      const { service } = build({ updateManyCount: 0 });

      await expect(service.issueNeedle('exchange-1', { quantity: 5 }, user)).rejects.toThrow(
        `Insufficient stock at location ${TROLLEY_LOCATION} for needle type ${NEEDLE_TYPE}: 5 requested`,
      );
    });

    it('notifies the PIC exactly once', async () => {
      const { service, notifyExchangeStuck } = build({ updateManyCount: 0 });

      await expect(service.issueNeedle('exchange-1', {}, user)).rejects.toThrow();

      expect(notifyExchangeStuck).toHaveBeenCalledTimes(1);
      expect(notifyExchangeStuck).toHaveBeenCalledWith('exchange-1', 'INSUFFICIENT_STOCK');
    });

    it('writes no stock movement', async () => {
      const { service, stockMovementCreate } = build({ updateManyCount: 0 });

      await expect(service.issueNeedle('exchange-1', {}, user)).rejects.toThrow();

      expect(stockMovementCreate).not.toHaveBeenCalled();
    });
  });

  /**
   * The reason this ticket exists. The handler used to react to *any*
   * `ConflictException` escaping the transaction, which was safe only because
   * the method's other conflicts were thrown before the `try`. Matching by
   * type means a conflict raised inside the transaction can never be
   * misreported to a PIC as a stock shortfall.
   */
  describe('other failures inside the transaction', () => {
    it('does not notify when a ConflictException is raised after the decrement', async () => {
      const { service, notifyExchangeStuck } = build({
        updateManyCount: 1,
        movementError: new ConflictException('movement number collision'),
      });

      await expect(service.issueNeedle('exchange-1', {}, user)).rejects.toThrow(
        'movement number collision',
      );

      expect(notifyExchangeStuck).not.toHaveBeenCalled();
    });

    it('propagates a generic error untouched and does not notify', async () => {
      const { service, notifyExchangeStuck } = build({
        updateManyCount: 1,
        movementError: new Error('database connection lost'),
      });

      await expect(service.issueNeedle('exchange-1', {}, user)).rejects.toThrow(
        'database connection lost',
      );

      expect(notifyExchangeStuck).not.toHaveBeenCalled();
    });
  });
});

describe('InsufficientStockError', () => {
  it('carries the location, needle type and requested quantity', () => {
    const error = new InsufficientStockError(TROLLEY_LOCATION, NEEDLE_TYPE, 7);

    expect(error.locationId).toBe(TROLLEY_LOCATION);
    expect(error.needleTypeId).toBe(NEEDLE_TYPE);
    expect(error.requested).toBe(7);
  });

  it('is a plain domain error, not an HttpException', () => {
    const error = new InsufficientStockError(TROLLEY_LOCATION, NEEDLE_TYPE, 1);

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ConflictException);
    expect(error.name).toBe('InsufficientStockError');
  });
});
