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

const SUPPLIER = 'supplier-1';

const dto = {
  factoryId: FACTORY,
  destinationLocationId: LOCATION,
  needleTypeId: NEEDLE_TYPE,
  quantity: 500,
  supplierId: SUPPLIER,
  referenceDocument: 'GR-00001',
  note: 'Initial stock',
};

/** Midnight UTC, the shape the `date` column stores. */
const utcDay = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

function build(
  options: { location?: object | null; needleType?: object | null; supplier?: object | null } = {},
) {
  const stockMovementCreate = jest.fn().mockResolvedValue({
    id: 'movement-1',
    movementNumber: 'MV-20260820-000001',
    factoryId: FACTORY,
    createdAt: new Date('2026-08-20T00:00:00Z'),
  });
  const inventoryBalanceUpsert = jest.fn().mockResolvedValue({ quantity: 500 });

  const stockReceivingCreate = jest.fn().mockResolvedValue({});

  const tx = {
    stockMovement: { create: stockMovementCreate },
    stockReceiving: { create: stockReceivingCreate },
    inventoryBalance: { upsert: inventoryBalanceUpsert },
    $queryRaw: jest.fn().mockResolvedValue([{ last_value: 1 }]),
  };

  const prisma = {
    factory: { findUnique: jest.fn().mockResolvedValue({ id: FACTORY, status: 'ACTIVE' }) },
    location:
      options.location === null
        ? { findUnique: jest.fn().mockResolvedValue(null) }
        : {
            findUnique: jest.fn().mockResolvedValue(
              options.location ?? {
                id: LOCATION,
                factoryId: FACTORY,
                locationType: 'WAREHOUSE',
              },
            ),
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
    supplier: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.supplier === null ? null : (options.supplier ?? { id: SUPPLIER }),
        ),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const numbers = { next: jest.fn().mockResolvedValue('MV-20260820-000001') };

  const service = new InventoryService(
    prisma as unknown as PrismaService,
    numbers as unknown as NumberSequenceService,
  );

  return { service, tx, stockMovementCreate, stockReceivingCreate, inventoryBalanceUpsert };
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
    const { service } = build({
      location: { id: LOCATION, factoryId: 'factory-b', locationType: 'WAREHOUSE' },
    });

    await expect(service.receiveStock(dto, user)).rejects.toThrow(BadRequestException);
  });

  it.each(['TROLLEY', 'USED_NEEDLE_STORAGE'])(
    'refuses to receive into a %s location — receiving lands in a warehouse (Docs/02 Process F)',
    async (locationType) => {
      const { service, stockMovementCreate } = build({
        location: { id: LOCATION, factoryId: FACTORY, locationType },
      });

      await expect(service.receiveStock(dto, user)).rejects.toThrow(BadRequestException);
      expect(stockMovementCreate).not.toHaveBeenCalled();
    },
  );

  it('writes the header and points the movement at it, not at itself', async () => {
    const { service, stockMovementCreate, stockReceivingCreate } = build();

    const result = await service.receiveStock(dto, user);

    const [[movement]] = stockMovementCreate.mock.calls as [[{ data: Record<string, unknown> }]];
    expect(movement.data.referenceType).toBe('RECEIVING');
    expect(movement.data.referenceId).toBe(result.receivingId);
    expect(movement.data.referenceId).not.toBe(movement.data.id);

    expect(stockReceivingCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: result.receivingId,
        supplierId: SUPPLIER,
        referenceDocument: 'GR-00001',
        note: 'Initial stock',
      }) as unknown,
    });
  });

  it('rejects a supplier that does not exist', async () => {
    const { service, stockMovementCreate } = build({ supplier: null });

    await expect(service.receiveStock(dto, user)).rejects.toThrow(BadRequestException);
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  /** Decision 4: a late entry can be dated to the day the goods actually arrived. */
  it('accepts a backdated receivedDate and stores the day itself', async () => {
    const { service, stockReceivingCreate } = build();

    const result = await service.receiveStock(
      { ...dto, receivedDate: new Date('2026-01-05T17:30:00.000Z') },
      user,
    );

    expect(result.receivedDate).toEqual(utcDay('2026-01-05'));
    expect(stockReceivingCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ receivedDate: utcDay('2026-01-05') }) as unknown,
    });
  });

  it('refuses a receivedDate in the future — nothing arrives tomorrow', async () => {
    const { service, stockMovementCreate } = build();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(service.receiveStock({ ...dto, receivedDate: tomorrow }, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(stockMovementCreate).not.toHaveBeenCalled();
  });

  it('defaults receivedDate to today when it is omitted', async () => {
    const { service } = build();
    const today = new Date();
    const startOfToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    const result = await service.receiveStock(dto, user);

    expect(result.receivedDate).toEqual(startOfToday);
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
