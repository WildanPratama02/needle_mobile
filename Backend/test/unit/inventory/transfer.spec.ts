import { BadRequestException, ConflictException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { NumberSequenceService } from '../../../src/modules/exchange/services/number-sequence.service';
import { InventoryService } from '../../../src/modules/inventory/services/inventory.service';

const FACTORY = 'factory-a';
const SOURCE = 'source-location';
const DESTINATION = 'destination-location';
const NEEDLE_TYPE = 'needle-type-1';

const user: AuthenticatedUser = {
  id: 'pic-1',
  username: 'pic',
  name: 'PIC',
  roles: ['ADMIN_GUDANG'],
  permissions: ['STOCK_TRANSFER'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const dto = {
  factoryId: FACTORY,
  sourceLocationId: SOURCE,
  destinationLocationId: DESTINATION,
  needleTypeId: NEEDLE_TYPE,
  quantity: 100,
  note: 'Replenishment trolley',
};

/** `updateManyCount` drives the source compare-and-set, same idiom as `issue-needle.spec.ts`. */
function build(options: { updateManyCount?: number } = {}) {
  const stockMovementCreate = jest.fn().mockResolvedValue({});
  const inventoryBalanceUpdateMany = jest
    .fn()
    .mockResolvedValue({ count: options.updateManyCount ?? 1 });
  const inventoryBalanceUpsert = jest.fn().mockResolvedValue({ quantity: 100 });
  const inventoryBalanceFindUniqueOrThrow = jest.fn().mockResolvedValue({ quantity: 400 });

  const tx = {
    stockMovement: { create: stockMovementCreate },
    inventoryBalance: {
      updateMany: inventoryBalanceUpdateMany,
      upsert: inventoryBalanceUpsert,
      findUniqueOrThrow: inventoryBalanceFindUniqueOrThrow,
    },
    $queryRaw: jest.fn().mockResolvedValue([{ last_value: 1 }]),
  };

  const prisma = {
    location: {
      findUnique: jest.fn().mockImplementation(({ where: { id } }: { where: { id: string } }) => {
        if (id === SOURCE) return Promise.resolve({ id: SOURCE, factoryId: FACTORY });
        if (id === DESTINATION) return Promise.resolve({ id: DESTINATION, factoryId: FACTORY });
        return Promise.resolve(null);
      }),
    },
    needleType: { findUnique: jest.fn().mockResolvedValue({ id: NEEDLE_TYPE, status: 'ACTIVE' }) },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const numbers = { next: jest.fn().mockResolvedValue('MV-20260820-000001') };

  const service = new InventoryService(
    prisma as unknown as PrismaService,
    numbers as unknown as NumberSequenceService,
  );

  return { service, tx, stockMovementCreate, inventoryBalanceUpdateMany };
}

describe('InventoryService.transferStock', () => {
  it('writes a paired TRANSFER_OUT/TRANSFER_IN and moves both balances', async () => {
    const { service, stockMovementCreate } = build({ updateManyCount: 1 });

    const result = await service.transferStock(dto, user);

    expect(stockMovementCreate).toHaveBeenCalledTimes(2);
    expect(stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'TRANSFER_OUT',
          sourceLocationId: SOURCE,
        }) as unknown,
      }),
    );
    expect(stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'TRANSFER_IN',
          destinationLocationId: DESTINATION,
        }) as unknown,
      }),
    );
    expect(result.sourceBalanceQuantity).toBe(400);
    expect(result.destinationBalanceQuantity).toBe(100);
  });

  it('decrements the source with a compare-and-set guard', async () => {
    const { service, tx } = build({ updateManyCount: 1 });

    await service.transferStock(dto, user);

    expect(tx.inventoryBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ quantity: { gte: 100 } }) as unknown,
        data: { quantity: { decrement: 100 } },
      }),
    );
  });

  it('maps insufficient source stock to 409 and writes nothing', async () => {
    const { service, stockMovementCreate } = build({ updateManyCount: 0 });

    await expect(service.transferStock(dto, user)).rejects.toThrow(ConflictException);
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  it('rejects when source and destination are the same location', async () => {
    const { service } = build();

    await expect(
      service.transferStock({ ...dto, destinationLocationId: SOURCE }, user),
    ).rejects.toThrow(BadRequestException);
  });
});
