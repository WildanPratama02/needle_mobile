import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityStatus, Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { MasterDataService } from '../../../src/modules/master-data/services/master-data.service';

/**
 * Needle Type / Factory / Trolley writes
 * (`.scratch/admin-panel-crud/issues/01`–`03`). Storage mapping writes have
 * their own spec (`storage-mapping.spec.ts`).
 */

const FACTORY = 'factory-a';
const OTHER_FACTORY = 'factory-b';

const user: AuthenticatedUser = {
  id: 'admin-1',
  username: 'admin',
  name: 'Admin',
  roles: ['SYSTEM_ADMIN'],
  permissions: ['MASTER_EDIT'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
  });

function build(
  options: {
    needleType?: Record<string, unknown> | null;
    factory?: Record<string, unknown> | null;
    trolley?: Record<string, unknown> | null;
    location?: Record<string, unknown> | null;
    supplier?: Record<string, unknown> | null;
    createError?: Error;
  } = {},
) {
  const echo = (id: string) =>
    jest
      .fn()
      .mockImplementation((args: { data: Record<string, unknown> }) => ({ id, ...args.data }));
  const createOrFail = (id: string) =>
    options.createError ? jest.fn().mockRejectedValue(options.createError) : echo(id);

  const tx = {
    factory: { create: createOrFail('factory-new') },
    userFactoryScope: { create: jest.fn().mockResolvedValue({}) },
    location: { create: echo('location-new') },
    trolley: { create: createOrFail('trolley-new') },
  };

  const prisma = {
    needleType: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.needleType === undefined
            ? { id: 'nt-1', code: 'DBX1', status: 'ACTIVE' }
            : options.needleType,
        ),
      create: createOrFail('nt-new'),
      update: echo('nt-1'),
    },
    factory: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.factory === undefined ? { id: FACTORY, status: 'ACTIVE' } : options.factory,
        ),
      update: echo(FACTORY),
    },
    trolley: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.trolley === undefined
            ? { id: 'trolley-1', factoryId: FACTORY, locationId: 'location-1' }
            : options.trolley,
        ),
      update: echo('trolley-1'),
    },
    location: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.location === undefined
            ? { id: 'location-2', factoryId: FACTORY, locationType: 'TROLLEY' }
            : options.location,
        ),
      create: createOrFail('location-new'),
      update: echo('location-2'),
    },
    supplier: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          options.supplier === undefined
            ? { id: 'supplier-1', code: 'SUP-001', name: 'PT Jarum Makmur' }
            : options.supplier,
        ),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: createOrFail('supplier-new'),
      update: echo('supplier-1'),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  const service = new MasterDataService(prisma as unknown as PrismaService);
  return { service, prisma, tx };
}

describe('MasterDataService — needle type writes', () => {
  const createDto = {
    code: 'DBX1',
    name: 'DBX1 needle',
    category: 'Sewing',
    unit: 'PCS',
    minimumStock: 50,
  };

  it('creates a needle type', async () => {
    const { service, prisma } = build();

    await service.createNeedleType(createDto);

    expect(prisma.needleType.create).toHaveBeenCalledWith({ data: createDto });
  });

  it('maps a duplicate code to 409', async () => {
    const { service } = build({ createError: p2002() });

    await expect(service.createNeedleType(createDto)).rejects.toThrow(ConflictException);
  });

  it('updates editable fields only — never code', async () => {
    const { service, prisma } = build();

    await service.updateNeedleType('nt-1', { name: 'Renamed', minimumStock: 10 });

    expect(prisma.needleType.update).toHaveBeenCalledWith({
      where: { id: 'nt-1' },
      data: { name: 'Renamed', minimumStock: 10 },
    });
  });

  it('rejects an update to an unknown needle type with 404', async () => {
    const { service } = build({ needleType: null });

    await expect(service.updateNeedleType('missing', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sets status on activate/deactivate', async () => {
    const { service, prisma } = build();

    await service.setNeedleTypeStatus('nt-1', EntityStatus.INACTIVE);

    expect(prisma.needleType.update).toHaveBeenCalledWith({
      where: { id: 'nt-1' },
      data: { status: EntityStatus.INACTIVE },
    });
  });
});

describe('MasterDataService — factory writes', () => {
  const createDto = { code: 'FACTORY-01', name: 'Factory 01', timezone: 'Asia/Jakarta' };

  it('creates the factory and grants the creator scope to it in the same transaction', async () => {
    const { service, tx } = build();

    const row = await service.createFactory(createDto, user);

    expect(tx.factory.create).toHaveBeenCalledWith({ data: createDto });
    expect(tx.userFactoryScope.create).toHaveBeenCalledWith({
      data: { userId: user.id, factoryId: row.id },
    });
  });

  it('creates the default warehouse with it, so the factory is usable immediately', async () => {
    const { service, tx } = build();

    const row = await service.createFactory(createDto, user);

    expect(tx.location.create).toHaveBeenCalledWith({
      data: {
        factoryId: row.id,
        code: 'WH-01',
        name: 'Main Warehouse',
        locationType: 'WAREHOUSE',
      },
    });
  });

  it('maps a duplicate code to 409', async () => {
    const { service } = build({ createError: p2002() });

    await expect(service.createFactory(createDto, user)).rejects.toThrow(ConflictException);
  });

  it('refuses to edit a factory outside the caller scope', async () => {
    const { service } = build({ factory: { id: OTHER_FACTORY, status: 'ACTIVE' } });

    await expect(service.updateFactory(OTHER_FACTORY, { name: 'x' }, user)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('updates name/timezone/description', async () => {
    const { service, prisma } = build();

    await service.updateFactory(FACTORY, { name: 'Renamed', timezone: 'Asia/Makassar' }, user);

    expect(prisma.factory.update).toHaveBeenCalledWith({
      where: { id: FACTORY },
      data: { name: 'Renamed', timezone: 'Asia/Makassar' },
    });
  });

  it('deactivates without touching trolleys or locations', async () => {
    const { service, prisma } = build();

    await service.setFactoryStatus(FACTORY, EntityStatus.INACTIVE, user);

    expect(prisma.factory.update).toHaveBeenCalledWith({
      where: { id: FACTORY },
      data: { status: EntityStatus.INACTIVE },
    });
    expect(prisma.trolley.update).not.toHaveBeenCalled();
  });
});

describe('MasterDataService — supplier writes', () => {
  const createDto = {
    code: 'SUP-001',
    name: 'PT Jarum Makmur',
    contact: 'sales@jarummakmur.co.id',
  };

  it('creates a supplier', async () => {
    const { service, prisma } = build();

    await service.createSupplier(createDto);

    expect(prisma.supplier.create).toHaveBeenCalledWith({
      data: {
        code: 'SUP-001',
        name: 'PT Jarum Makmur',
        contact: 'sales@jarummakmur.co.id',
        description: undefined,
      },
    });
  });

  it('maps a duplicate code to 409', async () => {
    const { service } = build({ createError: p2002() });

    await expect(service.createSupplier(createDto)).rejects.toThrow(ConflictException);
  });

  it('updates the editable fields, never the code', async () => {
    const { service, prisma } = build();

    await service.updateSupplier('supplier-1', { name: 'Renamed', contact: '+62 811 0000' });

    expect(prisma.supplier.update).toHaveBeenCalledWith({
      where: { id: 'supplier-1' },
      data: { name: 'Renamed', contact: '+62 811 0000', description: undefined },
    });
  });

  /**
   * Decision 6: a supplier is never deactivated. There is no
   * `setSupplierStatus` to call, so the guard that matters is that an update
   * never writes a status either — the field does not exist on the model, and
   * this keeps it that way if somebody widens the DTO.
   */
  it('writes no status on update — a supplier has no lifecycle', async () => {
    const { service, prisma } = build();

    await service.updateSupplier('supplier-1', { name: 'Renamed' });

    const [[call]] = prisma.supplier.update.mock.calls as [[{ data: Record<string, unknown> }]];
    expect(Object.keys(call.data)).not.toContain('status');
  });

  it('rejects an update to an unknown supplier with 404', async () => {
    const { service } = build({ supplier: null });

    await expect(service.updateSupplier('missing', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('MasterDataService — location writes', () => {
  const createDto = {
    factoryId: FACTORY,
    code: 'WH-02',
    name: 'Second Warehouse',
    locationType: 'WAREHOUSE' as const,
  };
  /** The default `location` mock is a TROLLEY row; these tests need one that is not. */
  const warehouse = { id: 'location-2', factoryId: FACTORY, locationType: 'WAREHOUSE' };

  it('creates a location of the requested type', async () => {
    const { service, prisma } = build();

    await service.createLocation(createDto, user);

    expect(prisma.location.create).toHaveBeenCalledWith({
      data: {
        factoryId: FACTORY,
        code: 'WH-02',
        name: 'Second Warehouse',
        locationType: 'WAREHOUSE',
        parentLocationId: undefined,
      },
    });
  });

  it('refuses locationType TROLLEY — a trolley owns its own location (ADR-003)', async () => {
    const { service, prisma } = build();

    await expect(
      service.createLocation({ ...createDto, locationType: 'TROLLEY' as const }, user),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.location.create).not.toHaveBeenCalled();
  });

  it('rejects a factory outside the caller scope with 403', async () => {
    const { service } = build();

    await expect(
      service.createLocation({ ...createDto, factoryId: OTHER_FACTORY }, user),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an inactive factory with 400', async () => {
    const { service } = build({ factory: { id: FACTORY, status: 'INACTIVE' } });

    await expect(service.createLocation(createDto, user)).rejects.toThrow(BadRequestException);
  });

  it('maps a duplicate code within the factory to 409', async () => {
    const { service } = build({ createError: p2002() });

    await expect(service.createLocation(createDto, user)).rejects.toThrow(ConflictException);
  });

  it('refuses to edit a TROLLEY location — it is managed through its trolley', async () => {
    const { service, prisma } = build();

    await expect(service.updateLocation('location-2', { name: 'x' }, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.location.update).not.toHaveBeenCalled();
  });

  it('updates name, parent and status on a non-trolley location', async () => {
    const { service, prisma } = build({ location: warehouse });

    await service.updateLocation(
      'location-2',
      { name: 'Renamed', status: EntityStatus.INACTIVE },
      user,
    );

    expect(prisma.location.update).toHaveBeenCalledWith({
      where: { id: 'location-2' },
      data: { name: 'Renamed', parentLocationId: undefined, status: EntityStatus.INACTIVE },
    });
  });

  it('refuses a location as its own parent', async () => {
    const { service, prisma } = build({ location: warehouse });

    await expect(
      service.updateLocation('location-2', { parentLocationId: 'location-2' }, user),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.location.update).not.toHaveBeenCalled();
  });

  it('refuses to edit a location outside the caller scope', async () => {
    const { service } = build({
      location: { id: 'location-9', factoryId: OTHER_FACTORY, locationType: 'WAREHOUSE' },
    });

    await expect(service.updateLocation('location-9', { name: 'x' }, user)).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('MasterDataService — trolley writes', () => {
  const createDto = { factoryId: FACTORY, code: 'TR-01', name: 'Trolley 01' };

  it('creates the trolley together with its own TROLLEY location (ADR-003)', async () => {
    const { service, tx } = build();

    await service.createTrolley(createDto, user);

    expect(tx.location.create).toHaveBeenCalledWith({
      data: { factoryId: FACTORY, code: 'TR-01', name: 'Trolley 01', locationType: 'TROLLEY' },
    });
    expect(tx.trolley.create).toHaveBeenCalledWith({
      data: { factoryId: FACTORY, locationId: 'location-new', code: 'TR-01', name: 'Trolley 01' },
    });
  });

  it('rejects a factory outside the caller scope with 403', async () => {
    const { service } = build();

    await expect(
      service.createTrolley({ ...createDto, factoryId: OTHER_FACTORY }, user),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an inactive factory with 400', async () => {
    const { service } = build({ factory: { id: FACTORY, status: 'INACTIVE' } });

    await expect(service.createTrolley(createDto, user)).rejects.toThrow(BadRequestException);
  });

  it('maps a duplicate code to 409', async () => {
    const { service } = build({ createError: p2002() });

    await expect(service.createTrolley(createDto, user)).rejects.toThrow(ConflictException);
  });

  it('updates name/status', async () => {
    const { service, prisma } = build();

    await service.updateTrolley(
      'trolley-1',
      { name: 'Renamed', status: EntityStatus.INACTIVE },
      user,
    );

    expect(prisma.trolley.update).toHaveBeenCalledWith({
      where: { id: 'trolley-1' },
      data: { name: 'Renamed', status: EntityStatus.INACTIVE },
    });
  });

  it('refuses to edit a trolley outside the caller scope', async () => {
    const { service } = build({
      trolley: { id: 'trolley-1', factoryId: OTHER_FACTORY, locationId: 'l' },
    });

    await expect(service.updateTrolley('trolley-1', { name: 'x' }, user)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a new locationId that is not a TROLLEY location in the trolley factory', async () => {
    const { service } = build({
      location: { id: 'location-2', factoryId: FACTORY, locationType: 'WAREHOUSE' },
    });

    await expect(
      service.updateTrolley('trolley-1', { locationId: 'location-2' }, user),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps a locationId already owned by another trolley to 409', async () => {
    const { service, prisma } = build();
    prisma.trolley.update.mockRejectedValueOnce(p2002());

    await expect(
      service.updateTrolley('trolley-1', { locationId: 'location-2' }, user),
    ).rejects.toThrow(ConflictException);
  });
});
