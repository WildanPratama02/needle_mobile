import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { MasterDataService } from '../../../src/modules/master-data/services/master-data.service';

const FACTORY = 'factory-a';
const OTHER_FACTORY = 'factory-b';
const TROLLEY = 'trolley-1';
const EXCHANGE_TYPE = 'exchange-type-1';
const STORAGE_LOCATION = 'location-storage-1';

const user: AuthenticatedUser = {
  id: 'admin-1',
  username: 'admin',
  name: 'Admin',
  roles: ['SYSTEM_ADMIN'],
  permissions: ['MASTER_EDIT'],
  factoryIds: [FACTORY],
  locationIds: [],
};

function build(
  options: {
    storageLocation?: { id: string; factoryId: string; locationType: string } | null;
    exchangeType?: { id: string; status: string } | null;
    createError?: Error;
  } = {},
) {
  const trolleyFindUnique = jest.fn().mockResolvedValue({ id: TROLLEY, factoryId: FACTORY });
  const locationFindUnique = jest
    .fn()
    .mockResolvedValue(
      options.storageLocation === undefined
        ? { id: STORAGE_LOCATION, factoryId: FACTORY, locationType: 'USED_NEEDLE_STORAGE' }
        : options.storageLocation,
    );
  const exchangeTypeFindUnique = jest
    .fn()
    .mockResolvedValue(
      options.exchangeType === undefined ? { id: EXCHANGE_TYPE, status: 'ACTIVE' } : options.exchangeType,
    );
  const storageMappingCreate = options.createError
    ? jest.fn().mockRejectedValue(options.createError)
    : jest.fn().mockResolvedValue({ id: 'mapping-1' });
  const storageMappingFindUnique = jest.fn().mockResolvedValue({
    id: 'mapping-1',
    trolleyId: TROLLEY,
    exchangeTypeId: EXCHANGE_TYPE,
    storageLocationId: STORAGE_LOCATION,
  });
  const storageMappingUpdate = jest
    .fn()
    .mockImplementation((args: { data: Record<string, unknown> }) => ({ id: 'mapping-1', ...args.data }));

  const prisma = {
    trolley: { findUnique: trolleyFindUnique },
    location: { findUnique: locationFindUnique },
    exchangeType: { findUnique: exchangeTypeFindUnique },
    storageMapping: {
      create: storageMappingCreate,
      findUnique: storageMappingFindUnique,
      update: storageMappingUpdate,
    },
  };

  const service = new MasterDataService(prisma as unknown as PrismaService);

  return { service, storageMappingCreate, storageMappingUpdate };
}

const createDto = { trolleyId: TROLLEY, exchangeTypeId: EXCHANGE_TYPE, storageLocationId: STORAGE_LOCATION };

describe('MasterDataService.createStorageMapping', () => {
  it('creates the mapping when the destination is a USED_NEEDLE_STORAGE location in the trolley\'s factory', async () => {
    const { service, storageMappingCreate } = build();

    await service.createStorageMapping(createDto, user);

    expect(storageMappingCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: createDto }),
    );
  });

  it('rejects a destination location that is not USED_NEEDLE_STORAGE', async () => {
    const { service } = build({
      storageLocation: { id: STORAGE_LOCATION, factoryId: FACTORY, locationType: 'WAREHOUSE' },
    });

    await expect(service.createStorageMapping(createDto, user)).rejects.toThrow(BadRequestException);
  });

  it('rejects a destination location in a different factory than the trolley', async () => {
    const { service } = build({
      storageLocation: { id: STORAGE_LOCATION, factoryId: OTHER_FACTORY, locationType: 'USED_NEEDLE_STORAGE' },
    });

    await expect(service.createStorageMapping(createDto, user)).rejects.toThrow(BadRequestException);
  });

  it('rejects an inactive exchange type', async () => {
    const { service } = build({ exchangeType: { id: EXCHANGE_TYPE, status: 'INACTIVE' } });

    await expect(service.createStorageMapping(createDto, user)).rejects.toThrow(BadRequestException);
  });

  it('rejects with 409 on a duplicate (trolleyId, exchangeTypeId) pair', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    const { service } = build({ createError: p2002 });

    await expect(service.createStorageMapping(createDto, user)).rejects.toThrow(ConflictException);
  });
});

describe('MasterDataService.updateStorageMapping', () => {
  it('updates only storageLocationId', async () => {
    const { service, storageMappingUpdate } = build();

    await service.updateStorageMapping('mapping-1', { storageLocationId: STORAGE_LOCATION }, user);

    expect(storageMappingUpdate).toHaveBeenCalledWith({
      where: { id: 'mapping-1' },
      data: { storageLocationId: STORAGE_LOCATION },
    });
  });

  it('re-validates the new destination the same way create does', async () => {
    const { service } = build({
      storageLocation: { id: STORAGE_LOCATION, factoryId: FACTORY, locationType: 'WAREHOUSE' },
    });

    await expect(
      service.updateStorageMapping('mapping-1', { storageLocationId: STORAGE_LOCATION }, user),
    ).rejects.toThrow(BadRequestException);
  });
});
