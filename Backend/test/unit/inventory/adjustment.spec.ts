import { ConflictException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { NumberSequenceService } from '../../../src/modules/exchange/services/number-sequence.service';
import { InventoryService } from '../../../src/modules/inventory/services/inventory.service';

const FACTORY = 'factory-a';
const LOCATION = 'location-1';
const NEEDLE_TYPE = 'needle-type-1';

const user: AuthenticatedUser = {
  id: 'pic-1',
  username: 'pic',
  name: 'PIC',
  roles: ['ADMIN_GUDANG'],
  permissions: ['STOCK_ADJUST'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const dto = {
  factoryId: FACTORY,
  locationId: LOCATION,
  needleTypeId: NEEDLE_TYPE,
  actualQuantity: 95,
  reason: 'Physical count variance',
};

function build(
  options: {
    existingBalance?: { quantity: number } | null;
    updateManyCount?: number;
  } = {},
) {
  const stockMovementCreate = jest.fn().mockResolvedValue({
    id: 'movement-1',
    movementNumber: 'MV-20260820-000001',
    createdAt: new Date('2026-08-20T00:00:00Z'),
  });
  const inventoryBalanceFindUnique = jest
    .fn()
    .mockResolvedValue(
      options.existingBalance === undefined ? { quantity: 100 } : options.existingBalance,
    );
  const inventoryBalanceUpdateMany = jest
    .fn()
    .mockResolvedValue({ count: options.updateManyCount ?? 1 });
  const inventoryBalanceCreate = jest.fn().mockResolvedValue({});

  const tx = {
    stockMovement: { create: stockMovementCreate },
    inventoryBalance: {
      findUnique: inventoryBalanceFindUnique,
      updateMany: inventoryBalanceUpdateMany,
      create: inventoryBalanceCreate,
    },
    $queryRaw: jest.fn().mockResolvedValue([{ last_value: 1 }]),
  };

  const prisma = {
    location: { findUnique: jest.fn().mockResolvedValue({ id: LOCATION, factoryId: FACTORY }) },
    needleType: { findUnique: jest.fn().mockResolvedValue({ id: NEEDLE_TYPE, status: 'ACTIVE' }) },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const numbers = { next: jest.fn().mockResolvedValue('MV-20260820-000001') };

  const service = new InventoryService(
    prisma as unknown as PrismaService,
    numbers as unknown as NumberSequenceService,
  );

  return { service, tx, stockMovementCreate, inventoryBalanceUpdateMany, inventoryBalanceCreate };
}

describe('InventoryService.adjustStock', () => {
  it('computes systemQuantity/actualQuantity/varianceQuantity and sets the balance', async () => {
    const { service } = build({ existingBalance: { quantity: 100 } });

    const result = await service.adjustStock(dto, user);

    expect(result.systemQuantity).toBe(100);
    expect(result.actualQuantity).toBe(95);
    expect(result.varianceQuantity).toBe(-5);
  });

  it('writes a signed ADJUSTMENT movement with no pending state — result is immediate', async () => {
    const { service, stockMovementCreate } = build({ existingBalance: { quantity: 100 } });

    await service.adjustStock(dto, user);

    expect(stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'ADJUSTMENT',
          quantity: 5,
          sourceLocationId: LOCATION,
          reason: 'Physical count variance',
        }) as unknown,
      }),
    );
  });

  it('creates a fresh balance row when none existed yet, treating systemQuantity as 0', async () => {
    const { service, inventoryBalanceCreate, inventoryBalanceUpdateMany } = build({
      existingBalance: null,
    });

    const result = await service.adjustStock({ ...dto, actualQuantity: 30 }, user);

    expect(result.systemQuantity).toBe(0);
    expect(result.varianceQuantity).toBe(30);
    expect(inventoryBalanceCreate).toHaveBeenCalled();
    expect(inventoryBalanceUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects with 409 when the balance changed between read and write', async () => {
    const { service } = build({ existingBalance: { quantity: 100 }, updateManyCount: 0 });

    await expect(service.adjustStock(dto, user)).rejects.toThrow(ConflictException);
  });
});
