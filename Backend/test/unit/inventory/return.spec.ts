import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

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
  roles: ['PIC_INVENTORY'],
  permissions: ['STOCK_RETURN'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const dto = {
  factoryId: FACTORY,
  sourceLocationId: SOURCE,
  destinationLocationId: DESTINATION,
  needleTypeId: NEEDLE_TYPE,
  quantity: 20,
  reason: 'Excess stock',
};

/** Structurally a transfer (`transfer.spec.ts`) with a mandatory reason and RETURN rows. */
function build(options: { updateManyCount?: number; factoryStatus?: string } = {}) {
  const stockMovementCreate = jest.fn().mockResolvedValue({});
  const inventoryBalanceUpdateMany = jest
    .fn()
    .mockResolvedValue({ count: options.updateManyCount ?? 1 });
  const inventoryBalanceUpsert = jest.fn().mockResolvedValue({ quantity: 20 });
  const inventoryBalanceFindUniqueOrThrow = jest.fn().mockResolvedValue({ quantity: 80 });

  const tx = {
    stockMovement: { create: stockMovementCreate },
    inventoryBalance: {
      updateMany: inventoryBalanceUpdateMany,
      upsert: inventoryBalanceUpsert,
      findUniqueOrThrow: inventoryBalanceFindUniqueOrThrow,
    },
  };

  const prisma = {
    factory: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: FACTORY, status: options.factoryStatus ?? 'ACTIVE' }),
    },
    location: {
      findUnique: jest
        .fn()
        .mockImplementation(({ where: { id } }: { where: { id: string } }) =>
          Promise.resolve({ id, factoryId: FACTORY }),
        ),
    },
    needleType: { findUnique: jest.fn().mockResolvedValue({ id: NEEDLE_TYPE, status: 'ACTIVE' }) },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const numbers = {
    next: jest
      .fn()
      .mockResolvedValueOnce('MV-20260914-000001')
      .mockResolvedValueOnce('MV-20260914-000002'),
  };

  const service = new InventoryService(
    prisma as unknown as PrismaService,
    numbers as unknown as NumberSequenceService,
  );

  return { service, stockMovementCreate, inventoryBalanceUpdateMany, inventoryBalanceUpsert };
}

describe('InventoryService.returnStock', () => {
  it('writes a paired RETURN out/in and moves both balances', async () => {
    const { service, stockMovementCreate, inventoryBalanceUpsert } = build();

    const result = await service.returnStock(dto, user);

    expect(stockMovementCreate).toHaveBeenCalledTimes(2);
    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        movementType: 'RETURN',
        sourceLocationId: SOURCE,
        referenceType: 'RETURN',
        referenceId: result.returnId,
        reason: 'Excess stock',
      }),
    });
    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        movementType: 'RETURN',
        destinationLocationId: DESTINATION,
        referenceId: result.returnId,
      }),
    });
    expect(inventoryBalanceUpsert).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        outMovementNumber: 'MV-20260914-000001',
        inMovementNumber: 'MV-20260914-000002',
        quantity: 20,
        reason: 'Excess stock',
        sourceBalanceQuantity: 80,
        destinationBalanceQuantity: 20,
      }),
    );
  });

  it('maps insufficient source stock to 409 without writing movements', async () => {
    const { service, stockMovementCreate } = build({ updateManyCount: 0 });

    await expect(service.returnStock(dto, user)).rejects.toThrow(ConflictException);
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  it('rejects identical source and destination', async () => {
    const { service } = build();

    await expect(
      service.returnStock({ ...dto, destinationLocationId: SOURCE }, user),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a caller outside the factory scope', async () => {
    const { service } = build();

    await expect(service.returnStock(dto, { ...user, factoryIds: ['factory-b'] })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects an inactive factory (FR-WEB-017)', async () => {
    const { service, inventoryBalanceUpdateMany } = build({ factoryStatus: 'INACTIVE' });

    await expect(service.returnStock(dto, user)).rejects.toThrow(BadRequestException);
    expect(inventoryBalanceUpdateMany).not.toHaveBeenCalled();
  });
});

describe('InventoryService — inactive factory takes no new stock writes (FR-WEB-017)', () => {
  it('rejects a transfer in an inactive factory', async () => {
    const { service } = build({ factoryStatus: 'INACTIVE' });

    await expect(
      service.transferStock(
        {
          factoryId: FACTORY,
          sourceLocationId: SOURCE,
          destinationLocationId: DESTINATION,
          needleTypeId: NEEDLE_TYPE,
          quantity: 1,
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an adjustment in an inactive factory', async () => {
    const { service } = build({ factoryStatus: 'INACTIVE' });

    await expect(
      service.adjustStock(
        {
          factoryId: FACTORY,
          locationId: SOURCE,
          needleTypeId: NEEDLE_TYPE,
          actualQuantity: 5,
          reason: 'count',
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a receiving in an inactive factory', async () => {
    const { service } = build({ factoryStatus: 'INACTIVE' });

    await expect(
      service.receiveStock(
        {
          factoryId: FACTORY,
          destinationLocationId: DESTINATION,
          needleTypeId: NEEDLE_TYPE,
          quantity: 1,
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
