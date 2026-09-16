import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { NumberSequenceService } from '../../../src/modules/exchange/services/number-sequence.service';
import { CountSessionService } from '../../../src/modules/inventory/services/count-session.service';
import { InventoryService } from '../../../src/modules/inventory/services/inventory.service';

const FACTORY = 'factory-a';
const LOCATION = 'location-1';
const SESSION = 'session-1';

const user: AuthenticatedUser = {
  id: 'pic-1',
  username: 'pic',
  name: 'PIC',
  roles: ['PIC_INVENTORY'],
  permissions: ['STOCK_COUNT'],
  factoryIds: [FACTORY],
  locationIds: [],
};

/** nt-a is 5 short; nt-b matches the system and needs no adjustment. */
const openSession = {
  id: SESSION,
  factoryId: FACTORY,
  locationId: LOCATION,
  status: 'OPEN',
  items: [
    { needleTypeId: 'nt-a', systemQuantity: 100, physicalQuantity: 95 },
    { needleTypeId: 'nt-b', systemQuantity: 10, physicalQuantity: 10 },
  ],
};

/**
 * A real `InventoryService` over mocked Prisma, so `complete` is exercised
 * through the same `writeAdjustment` ledger write `adjustment.spec.ts` covers.
 */
function build(
  options: {
    session?: Record<string, unknown>;
    factoryStatus?: string;
    balance?: number | null;
    /** Balance per needle type at complete time. Defaults to what was counted. */
    completeBalances?: Record<string, number>;
    claimCount?: number;
    /** Items as re-read inside the transaction. Defaults to the session's own. */
    countedItems?: Record<string, unknown>[];
  } = {},
) {
  const session = options.session ?? openSession;

  const stockMovementCreate = jest
    .fn()
    .mockImplementation((args: { data: { id: string; movementNumber: string } }) => ({
      id: args.data.id,
      movementNumber: args.data.movementNumber,
      createdAt: new Date('2026-09-14T00:00:00Z'),
    }));

  const tx = {
    countSession: { updateMany: jest.fn().mockResolvedValue({ count: options.claimCount ?? 1 }) },
    inventoryBalance: {
      findUnique: jest
        .fn()
        .mockImplementation(
          ({ where }: { where: { locationId_needleTypeId: { needleTypeId: string } } }) => {
            const balances = options.completeBalances ?? { 'nt-a': 100, 'nt-b': 10 };
            const quantity = balances[where.locationId_needleTypeId.needleTypeId];
            return Promise.resolve(quantity === undefined ? null : { quantity });
          },
        ),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({}),
    },
    stockMovement: { create: stockMovementCreate },
    stockAdjustment: { create: jest.fn().mockResolvedValue({}) },
    countSessionItem: {
      findMany: jest.fn().mockResolvedValue(options.countedItems ?? session.items),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  const prisma = {
    factory: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: FACTORY, status: options.factoryStatus ?? 'ACTIVE' }),
    },
    location: { findUnique: jest.fn().mockResolvedValue({ id: LOCATION, factoryId: FACTORY }) },
    needleType: { findUnique: jest.fn().mockResolvedValue({ id: 'nt-a', status: 'ACTIVE' }) },
    countSession: {
      findUnique: jest.fn().mockResolvedValue(session),
      updateMany: jest.fn().mockResolvedValue({ count: options.claimCount ?? 1 }),
      create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => ({
        id: SESSION,
        status: 'OPEN',
        items: [],
        ...args.data,
      })),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const numbers = { next: jest.fn().mockResolvedValue('MV-20260914-000001') };
  const inventory = new InventoryService(
    prisma as unknown as PrismaService,
    numbers as unknown as NumberSequenceService,
  );
  const service = new CountSessionService(prisma as unknown as PrismaService, inventory);

  return { service, prisma, tx, stockMovementCreate };
}

describe('CountSessionService.create', () => {
  it('opens a session for a location in the factory', async () => {
    const { service, prisma } = build();

    await service.create({ factoryId: FACTORY, locationId: LOCATION }, user);

    expect(prisma.countSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { factoryId: FACTORY, locationId: LOCATION, createdBy: user.id },
      }),
    );
  });

  it('rejects a factory outside the caller scope', async () => {
    const { service } = build();

    await expect(
      service.create({ factoryId: 'factory-b', locationId: LOCATION }, user),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an inactive factory', async () => {
    const { service } = build({ factoryStatus: 'INACTIVE' });

    await expect(
      service.create({ factoryId: FACTORY, locationId: LOCATION }, user),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('CountSessionService.addItem', () => {
  it('captures the current balance as systemQuantity, under the session lock', async () => {
    const { service, tx } = build({ completeBalances: { 'nt-a': 40 } });

    await service.addItem(SESSION, { needleTypeId: 'nt-a', physicalQuantity: 38 }, user);

    expect(tx.countSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SESSION, status: 'OPEN' } }),
    );
    expect(tx.countSessionItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          countSessionId: SESSION,
          needleTypeId: 'nt-a',
          systemQuantity: 40,
          physicalQuantity: 38,
        },
        update: { systemQuantity: 40, physicalQuantity: 38 },
      }),
    );
  });

  it('treats a location with no balance row as zero', async () => {
    const { service, tx } = build({ completeBalances: {} });

    await service.addItem(SESSION, { needleTypeId: 'nt-a', physicalQuantity: 3 }, user);

    expect(tx.countSessionItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { systemQuantity: 0, physicalQuantity: 3 } }),
    );
  });

  it('refuses to add to a completed session', async () => {
    const { service } = build({ session: { ...openSession, status: 'COMPLETED' } });

    await expect(
      service.addItem(SESSION, { needleTypeId: 'nt-a', physicalQuantity: 1 }, user),
    ).rejects.toThrow(ConflictException);
  });

  it('refuses a count that loses the race to a concurrent complete', async () => {
    const { service, tx } = build({ claimCount: 0 });

    await expect(
      service.addItem(SESSION, { needleTypeId: 'nt-a', physicalQuantity: 1 }, user),
    ).rejects.toThrow(ConflictException);
    expect(tx.countSessionItem.upsert).not.toHaveBeenCalled();
  });
});

describe('CountSessionService.complete', () => {
  it('claims the session and adjusts only the items with a variance', async () => {
    const { service, tx, stockMovementCreate } = build();

    const result = await service.complete(SESSION, user);

    expect(tx.countSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SESSION, status: 'OPEN' } }),
    );
    expect(stockMovementCreate).toHaveBeenCalledTimes(1);
    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        movementType: 'ADJUSTMENT',
        needleTypeId: 'nt-a',
        sourceLocationId: LOCATION,
        quantity: 5,
        referenceType: 'COUNT_SESSION',
        referenceId: SESSION,
      }) as unknown,
    });
    expect(result.adjustmentMovementIds).toHaveLength(1);
    expect(tx.stockAdjustment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: result.adjustmentMovementIds[0],
        reasonCode: 'PHYSICAL_COUNT',
        note: null,
        systemQuantity: 100,
        actualQuantity: 95,
        varianceQuantity: -5,
        countSessionId: SESSION,
      }) as unknown,
    });
  });

  it('reconciles the items as they stand inside the transaction, not an earlier copy', async () => {
    const { service, stockMovementCreate } = build({
      countedItems: [{ needleTypeId: 'nt-a', systemQuantity: 100, physicalQuantity: 98 }],
    });

    await service.complete(SESSION, user);

    expect(stockMovementCreate).toHaveBeenCalledTimes(1);
    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ needleTypeId: 'nt-a', quantity: 2 }) as unknown,
    });
  });

  it('refuses to reconcile a balance that moved since it was counted', async () => {
    const { service, stockMovementCreate } = build({
      completeBalances: { 'nt-a': 90, 'nt-b': 10 },
    });

    await expect(service.complete(SESSION, user)).rejects.toThrow(ConflictException);
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  it('refuses a session that is already completed', async () => {
    const { service } = build({ session: { ...openSession, status: 'COMPLETED' } });

    await expect(service.complete(SESSION, user)).rejects.toThrow(ConflictException);
  });

  it('refuses when a concurrent complete claimed the session first', async () => {
    const { service, stockMovementCreate } = build({ claimCount: 0 });

    await expect(service.complete(SESSION, user)).rejects.toThrow(ConflictException);
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  it('refuses a session with nothing counted', async () => {
    const { service } = build({ session: { ...openSession, items: [] } });

    await expect(service.complete(SESSION, user)).rejects.toThrow(BadRequestException);
  });

  it('refuses a cancelled session', async () => {
    const { service, stockMovementCreate } = build({
      session: { ...openSession, status: 'CANCELLED' },
    });

    await expect(service.complete(SESSION, user)).rejects.toThrow(ConflictException);
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });
});

describe('CountSessionService.cancel', () => {
  it('marks an open session CANCELLED without touching stock', async () => {
    const { service, prisma, stockMovementCreate } = build();

    await service.cancel(SESSION, user);

    expect(prisma.countSession.updateMany).toHaveBeenCalledWith({
      where: { id: SESSION, status: 'OPEN' },
      data: expect.objectContaining({
        status: 'CANCELLED',
        cancelledAt: expect.any(Date) as unknown,
      }) as unknown,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  it.each(['COMPLETED', 'CANCELLED'])('refuses a %s session', async (status) => {
    const { service, prisma } = build({ session: { ...openSession, status } });

    await expect(service.cancel(SESSION, user)).rejects.toThrow(ConflictException);
    expect(prisma.countSession.updateMany).not.toHaveBeenCalled();
  });

  it('refuses when a concurrent complete claimed the session first', async () => {
    const { service } = build({ claimCount: 0 });

    await expect(service.cancel(SESSION, user)).rejects.toThrow(ConflictException);
  });
});
