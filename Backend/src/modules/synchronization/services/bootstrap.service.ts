import { Injectable } from '@nestjs/common';
import { EntityStatus, ExchangeType, Location, NeedleType, StorageMapping } from '@prisma/client';

import { DeviceContext } from '../../../common/interfaces/device-context.interface';
import { PrismaService } from '../../../database/prisma.service';
import { BootstrapQueryDto } from '../dto/mobile-request.dto';
import { BootstrapResponseDto, MasterDataVersionsDto } from '../dto/mobile-response.dto';
import { versionOf } from './master-data-version';
import { SyncChangesService } from './sync-changes.service';

type MappingWithLocation = StorageMapping & { storageLocation: Location };

interface Catalogue {
  needleTypes: NeedleType[];
  exchangeTypes: ExchangeType[];
  storageMappings: MappingWithLocation[];
  versions: MasterDataVersionsDto;
}

/**
 * `GET /mobile/bootstrap` (Docs/12 §18, Docs/15 §16–17): everything a tablet
 * caches to work its trolley, keyed to the device's binding — factory and
 * trolley are never chosen by the tablet (Docs/07 §4).
 */
@Injectable()
export class BootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: SyncChangesService,
  ) {}

  /**
   * The master data a trolley's tablet needs, with its versions. Every row of
   * each collection is read (inactive included) because the version must see
   * a deactivation; the catalogues are small, and only ACTIVE rows are sent.
   */
  async catalogue(trolleyId: string): Promise<Catalogue> {
    const [needleTypes, exchangeTypes, storageMappings] = await Promise.all([
      this.prisma.needleType.findMany({ orderBy: [{ code: 'asc' }, { id: 'asc' }] }),
      this.prisma.exchangeType.findMany({ orderBy: [{ code: 'asc' }, { id: 'asc' }] }),
      this.prisma.storageMapping.findMany({
        where: { trolleyId },
        include: { storageLocation: true },
        orderBy: [{ exchangeTypeId: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      needleTypes,
      exchangeTypes,
      storageMappings,
      versions: {
        needleTypes: versionOf(needleTypes),
        exchangeTypes: versionOf(exchangeTypes),
        // The location's name and status travel with the mapping, so a rename
        // must change the version too.
        storageMappings: versionOf(storageMappings, (row) =>
          row.storageLocation.updatedAt.toISOString(),
        ),
      },
    };
  }

  async bootstrap(context: DeviceContext, query: BootstrapQueryDto): Promise<BootstrapResponseDto> {
    const { device, factory, trolley } = context;
    const [catalogue, watermark] = await Promise.all([
      this.catalogue(trolley.id),
      this.changes.currentCursor(device.id),
    ]);
    const { versions } = catalogue;
    const active = <T extends { status: EntityStatus }>(rows: T[]) =>
      rows.filter((row) => row.status === EntityStatus.ACTIVE);

    return {
      device: {
        id: device.id,
        deviceCode: device.deviceCode,
        deviceName: device.deviceName,
        status: device.status,
        appVersion: device.appVersion,
        lastSeenAt: device.lastSeenAt,
      },
      factory: {
        id: factory.id,
        code: factory.code,
        name: factory.name,
        timezone: factory.timezone,
      },
      trolley: {
        id: trolley.id,
        code: trolley.code,
        name: trolley.name,
        locationId: trolley.locationId,
      },
      exchangeTypes:
        query.exchangeTypesVersion === versions.exchangeTypes
          ? null
          : active(catalogue.exchangeTypes).map((row) => ({
              id: row.id,
              code: row.code,
              name: row.name,
              requiresFragmentValidation: row.requiresFragmentValidation,
            })),
      needleTypes:
        query.needleTypesVersion === versions.needleTypes
          ? null
          : active(catalogue.needleTypes).map((row) => ({
              id: row.id,
              code: row.code,
              name: row.name,
              category: row.category,
              unit: row.unit,
              minimumStock: row.minimumStock.toFixed(3),
            })),
      storageMappings:
        query.storageMappingsVersion === versions.storageMappings
          ? null
          : active(catalogue.storageMappings)
              .filter((row) => row.storageLocation.status === EntityStatus.ACTIVE)
              .map((row) => ({
                id: row.id,
                exchangeTypeId: row.exchangeTypeId,
                storageLocationId: row.storageLocationId,
                storageLocationCode: row.storageLocation.code,
                storageLocationName: row.storageLocation.name,
              })),
      masterDataVersions: versions,
      serverTime: new Date(),
      syncCursor: watermark,
    };
  }
}
