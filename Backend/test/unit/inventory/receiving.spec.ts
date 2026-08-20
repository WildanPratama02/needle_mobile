import { BadRequestException, ForbiddenException } from '@nestjs/common';

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
  permissions: ['STOCK_RECEIVE'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const dto = {
  factoryId: FACTORY,
  destinationLocationId: LOCATION,
  needleTypeId: NEEDLE_TYPE,
  quantity: 500,
  referenceDocument: 'GR-00001',
  note: 'Initial stock',
};

function build(options: { location?: object | null; needleType?: object | null } = {}) {
  const stockMovementCreate = jest.fn().mockResolvedValue({
    id: 'movement-1',
    movementNumber: 'MV-20260820-000001',
    factoryId: FACTORY,
    createdAt: new Date('2026-08-20T00:00:00Z'),
  });
  const inventoryBalanceUpsert = jest.fn().mockResolvedValue({ quantity: 500 });

  const tx = {
    stockMovement: { create: stockMovementCreate },
    inventoryBalance: { upsert: inventoryBalanceUpsert },
    $queryRaw: jest.fn().mockResolvedValue([{ last_value: 1 }]),
  };

  const prisma = {
    location:
      options.location === null
        ? { findUnique: jest.fn().mockResolvedValue(null) }
        : {
            findUnique: jest
              .fn()
              .mockResolvedValue(options.location ?? { id: LOCATION, factoryId: FACTORY }),
          },
    needleType: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.needleType === null
            ? null
            : (options.needleType ?? { id: NEEDLE_TYPE, status: 'ACTIVE' }),
        ),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const numbers = { next: jest.fn().mockResolvedValue('MV-20260820-000001') };

  const service = new InventoryService(
    prisma as unknown as PrismaService,
    numbers as unknown as NumberSequenceService,
  );

  return { service, tx, stockMovementCreate, inventoryBalanceUpsert };
}

describe('InventoryService.receiveStock', () => {
  it('writes a RECEIVING movement and increases the destination balance', async () => {
    const { service, stockMovementCreate, inventoryBalanceUpsert } = build();

    const result = await service.receiveStock(dto, user);

    expect(stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'RECEIVING',
          destinationLocationId: LOCATION,
          needleTypeId: NEEDLE_TYPE,
          quantity: 500,
        }) as unknown,
      }),
    );
    expect(inventoryBalanceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: { increment: 500 } },
      }),
    );
    expect(result.balanceQuantity).toBe(500);
  });

  it('combines referenceDocument and note into the single reason column', async () => {
    const { service, stockMovementCreate } = build();

    await service.receiveStock(dto, user);

    expect(stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reason: 'GR-00001 — Initial stock' }) as unknown,
      }),
    );
  });

  it('rejects a destination location outside the given factory', async () => {
    const { service } = build({ location: { id: LOCATION, factoryId: 'factory-b' } });

    await expect(service.receiveStock(dto, user)).rejects.toThrow(BadRequestException);
  });

  it('rejects an inactive needle type', async () => {
    const { service } = build({ needleType: { id: NEEDLE_TYPE, status: 'INACTIVE' } });

    await expect(service.receiveStock(dto, user)).rejects.toThrow(BadRequestException);
  });

  it('rejects a caller outside the factory scope', async () => {
    const { service } = build();
    const outsider: AuthenticatedUser = { ...user, factoryIds: ['factory-b'] };

    await expect(service.receiveStock(dto, outsider)).rejects.toThrow(ForbiddenException);
  });
});
