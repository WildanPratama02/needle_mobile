import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdjustmentReasonCode } from '@prisma/client';

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

/**
 * Structurally a transfer (`transfer.spec.ts`) with a mandatory reason, RETURN
 * rows, and a trolley → warehouse direction. `locationTypes` overrides the
 * type each location id resolves to.
 */
function build(
  options: {
    updateManyCount?: number;
    factoryStatus?: string;
    locationTypes?: Record<string, string>;
  } = {},
) {
  const locationTypes = options.locationTypes ?? {
    [SOURCE]: 'TROLLEY',
    [DESTINATION]: 'WAREHOUSE',
  };
  const stockMovementCreate = jest.fn().mockResolvedValue({});
  const stockRelocationCreate = jest
    .fn()
    .mockResolvedValue({ createdAt: new Date('2026-09-15T00:00:00Z') });
  const inventoryBalanceUpdateMany = jest
    .fn()
    .mockResolvedValue({ count: options.updateManyCount ?? 1 });
  const inventoryBalanceUpsert = jest.fn().mockResolvedValue({ quantity: 20 });
  const inventoryBalanceFindUniqueOrThrow = jest.fn().mockResolvedValue({ quantity: 80 });

  const tx = {
    stockMovement: { create: stockMovementCreate },
    stockRelocation: { create: stockRelocationCreate },
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
          Promise.resolve({ id, factoryId: FACTORY, locationType: locationTypes[id] }),
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

  return {
    service,
    stockMovementCreate,
    stockRelocationCreate,
    inventoryBalanceUpdateMany,
    inventoryBalanceUpsert,
  };
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
      }) as unknown,
    });
    expect(stockMovementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        movementType: 'RETURN',
        destinationLocationId: DESTINATION,
        referenceId: result.returnId,
      }) as unknown,
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

  it('writes the return header the movement pair references', async () => {
    const { service, stockRelocationCreate } = build();

    const result = await service.returnStock({ ...dto, referenceDocument: ' RT-7 ' }, user);

    expect(stockRelocationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: result.returnId,
        kind: 'RETURN',
        sourceLocationId: SOURCE,
        destinationLocationId: DESTINATION,
        quantity: 20,
        referenceDocument: 'RT-7',
        note: 'Excess stock',
        createdBy: user.id,
      }) as unknown,
    });
    expect(result.referenceDocument).toBe('RT-7');
  });

  it.each([
    ['a warehouse source', { [SOURCE]: 'WAREHOUSE', [DESTINATION]: 'WAREHOUSE' }],
    ['a trolley destination', { [SOURCE]: 'TROLLEY', [DESTINATION]: 'TROLLEY' }],
    ['the reverse direction', { [SOURCE]: 'WAREHOUSE', [DESTINATION]: 'TROLLEY' }],
  ])('rejects %s — a return is trolley to warehouse only', async (_label, locationTypes) => {
    const { service, inventoryBalanceUpdateMany } = build({ locationTypes });

    await expect(service.returnStock(dto, user)).rejects.toThrow(BadRequestException);
    expect(inventoryBalanceUpdateMany).not.toHaveBeenCalled();
  });

  it('maps insufficient source stock to 409 without writing movements', async () => {
    const { service, stockMovementCreate } = build({ updateManyCount: 0 });

    await expect(service.returnStock(dto, user)).rejects.toMatchObject({
      status: 409,
      code: 'INVENTORY_INSUFFICIENT_STOCK',
    });
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
          reasonCode: AdjustmentReasonCode.DAMAGED,
          evidenceIds: ['evidence-1'],
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
