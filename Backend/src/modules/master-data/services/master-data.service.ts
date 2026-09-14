import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityStatus,
  ExchangeType,
  Factory,
  Location,
  LocationType,
  NeedleType,
  Prisma,
  StorageMapping,
  Trolley,
} from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateFactoryDto,
  CreateNeedleTypeDto,
  CreateStorageMappingDto,
  CreateTrolleyDto,
  UpdateFactoryDto,
  UpdateNeedleTypeDto,
  UpdateStorageMappingDto,
  UpdateTrolleyDto,
} from '../dto/master-data-request.dto';
import {
  MasterDataQueryDto,
  ScopedMasterDataQueryDto,
  StorageMappingQueryDto,
} from '../dto/master-data-query.dto';

const MAX_PAGE_SIZE = 100;

export interface PagedRows<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Alphabetical, with the id as a tiebreaker so paging cannot repeat or drop a row. */
const BY_CODE = [{ code: 'asc' as const }, { id: 'asc' as const }];

/**
 * Master data: reads for every collection, writes for `StorageMapping`,
 * `NeedleType`, `Factory` and `Trolley`.
 *
 * `Location` and `ExchangeType` stay query-only (`Location` writes are
 * deferred, `.scratch/admin-panel-crud/issues/09`). `Employee`'s own writes
 * live in the `employee` module instead (decision #15) — this module kept
 * only its reads.
 *
 * **Two scope classes, because the schema has two.** `Factory`, `Location`,
 * `Trolley` and `Employee` are factory-scoped and filtered at the query level.
 * `NeedleType` and `ExchangeType` have no `factoryId` column — they are
 * business-wide catalogues, and pretending otherwise would either leak or
 * silently return nothing depending on which way the mistake went.
 * `StorageMapping` has no `factoryId` column either, but is scoped through
 * its trolley's.
 */
@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  private static paging(query: MasterDataQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  /**
   * A requested factory is intersected with the caller's scope rather than
   * replacing it, so the filter can only ever narrow what they may see. Same
   * rule the exchange, confirmation and audit list services apply.
   */
  private static scopedFactoryIds(user: AuthenticatedUser, requested?: string): string[] {
    return requested ? user.factoryIds.filter((id) => id === requested) : user.factoryIds;
  }

  private static found<T>(row: T | null, label: string, id: string): T {
    if (!row) {
      throw new NotFoundException(`${label} not found: ${id}`);
    }
    return row;
  }

  // ---------------------------------------------------------------------
  // Factory-scoped collections
  // ---------------------------------------------------------------------

  async findFactories(
    query: ScopedMasterDataQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<Factory>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    // A factory is in scope by its own id, not by a `factoryId` column.
    const where = {
      id: { in: MasterDataService.scopedFactoryIds(user, query.factoryId) },
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.factory.findMany({ where, orderBy: BY_CODE, skip, take }),
      this.prisma.factory.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findLocations(
    query: ScopedMasterDataQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<Location>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    const where = {
      factoryId: { in: MasterDataService.scopedFactoryIds(user, query.factoryId) },
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({ where, orderBy: BY_CODE, skip, take }),
      this.prisma.location.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findTrolleys(
    query: ScopedMasterDataQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<Trolley>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    const where = {
      factoryId: { in: MasterDataService.scopedFactoryIds(user, query.factoryId) },
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trolley.findMany({ where, orderBy: BY_CODE, skip, take }),
      this.prisma.trolley.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findStorageMappings(
    query: StorageMappingQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<StorageMapping>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    const scopedFactoryIds = MasterDataService.scopedFactoryIds(user, query.factoryId);
    const where: Prisma.StorageMappingWhereInput = {
      trolleyId: query.trolleyId,
      exchangeTypeId: query.exchangeTypeId,
      status: query.status,
      trolley: { factoryId: { in: scopedFactoryIds } },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.storageMapping.findMany({ where, orderBy: { id: 'asc' }, skip, take }),
      this.prisma.storageMapping.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // ---------------------------------------------------------------------
  // Global catalogues — no factory dimension exists to filter on
  // ---------------------------------------------------------------------

  async findNeedleTypes(query: MasterDataQueryDto): Promise<PagedRows<NeedleType>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    const where = { status: query.status };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.needleType.findMany({ where, orderBy: BY_CODE, skip, take }),
      this.prisma.needleType.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findExchangeTypes(query: MasterDataQueryDto): Promise<PagedRows<ExchangeType>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    const where = { status: query.status };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exchangeType.findMany({ where, orderBy: BY_CODE, skip, take }),
      this.prisma.exchangeType.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // ---------------------------------------------------------------------
  // Single row
  //
  // Scope is checked after loading, so a caller cannot use the difference
  // between 404 and 403 to discover which ids exist outside their scope —
  // both answers are equally available to anyone holding MASTER_VIEW.
  // ---------------------------------------------------------------------

  async findFactory(id: string, user: AuthenticatedUser): Promise<Factory> {
    const row = MasterDataService.found(
      await this.prisma.factory.findUnique({ where: { id } }),
      'Factory',
      id,
    );
    assertFactoryScope(user, row.id);
    return row;
  }

  async findLocation(id: string, user: AuthenticatedUser): Promise<Location> {
    const row = MasterDataService.found(
      await this.prisma.location.findUnique({ where: { id } }),
      'Location',
      id,
    );
    assertFactoryScope(user, row.factoryId);
    return row;
  }

  async findTrolley(id: string, user: AuthenticatedUser): Promise<Trolley> {
    const row = MasterDataService.found(
      await this.prisma.trolley.findUnique({ where: { id } }),
      'Trolley',
      id,
    );
    assertFactoryScope(user, row.factoryId);
    return row;
  }

  async findNeedleType(id: string): Promise<NeedleType> {
    return MasterDataService.found(
      await this.prisma.needleType.findUnique({ where: { id } }),
      'Needle type',
      id,
    );
  }

  async findExchangeType(id: string): Promise<ExchangeType> {
    return MasterDataService.found(
      await this.prisma.exchangeType.findUnique({ where: { id } }),
      'Exchange type',
      id,
    );
  }

  async findStorageMapping(id: string, user: AuthenticatedUser): Promise<StorageMapping> {
    const row = MasterDataService.found(
      await this.prisma.storageMapping.findUnique({
        where: { id },
        include: { trolley: true },
      }),
      'Storage mapping',
      id,
    );
    assertFactoryScope(user, row.trolley.factoryId);
    return row;
  }

  // ---------------------------------------------------------------------
  // StorageMapping writes
  // ---------------------------------------------------------------------

  /** Loads the trolley (asserting scope) and validates the destination location. */
  private async loadTrolleyAndValidateStorageLocation(
    trolleyId: string,
    storageLocationId: string,
    user: AuthenticatedUser,
  ): Promise<Trolley> {
    const trolley = MasterDataService.found(
      await this.prisma.trolley.findUnique({ where: { id: trolleyId } }),
      'Trolley',
      trolleyId,
    );
    assertFactoryScope(user, trolley.factoryId);

    const storageLocation = MasterDataService.found(
      await this.prisma.location.findUnique({ where: { id: storageLocationId } }),
      'Storage location',
      storageLocationId,
    );
    if (storageLocation.locationType !== LocationType.USED_NEEDLE_STORAGE) {
      throw new BadRequestException('storageLocationId must be a USED_NEEDLE_STORAGE location');
    }
    if (storageLocation.factoryId !== trolley.factoryId) {
      throw new BadRequestException("storageLocationId must belong to the trolley's factory");
    }

    return trolley;
  }

  async createStorageMapping(
    dto: CreateStorageMappingDto,
    user: AuthenticatedUser,
  ): Promise<StorageMapping> {
    await this.loadTrolleyAndValidateStorageLocation(dto.trolleyId, dto.storageLocationId, user);

    const exchangeType = MasterDataService.found(
      await this.prisma.exchangeType.findUnique({ where: { id: dto.exchangeTypeId } }),
      'Exchange type',
      dto.exchangeTypeId,
    );
    if (exchangeType.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('exchangeTypeId must be ACTIVE');
    }

    try {
      return await this.prisma.storageMapping.create({
        data: {
          trolleyId: dto.trolleyId,
          exchangeTypeId: dto.exchangeTypeId,
          storageLocationId: dto.storageLocationId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `A storage mapping already exists for trolley ${dto.trolleyId} and exchange type ${dto.exchangeTypeId}`,
        );
      }
      throw error;
    }
  }

  async updateStorageMapping(
    id: string,
    dto: UpdateStorageMappingDto,
    user: AuthenticatedUser,
  ): Promise<StorageMapping> {
    const existing = MasterDataService.found(
      await this.prisma.storageMapping.findUnique({ where: { id } }),
      'Storage mapping',
      id,
    );
    await this.loadTrolleyAndValidateStorageLocation(
      existing.trolleyId,
      dto.storageLocationId,
      user,
    );

    return this.prisma.storageMapping.update({
      where: { id },
      data: { storageLocationId: dto.storageLocationId },
    });
  }
  // ---------------------------------------------------------------------
  // NeedleType writes (`.scratch/admin-panel-crud/issues/01`)
  //
  // No delete, ever (Docs/18 §26): deactivation blocks new use through the
  // ACTIVE checks exchange/inventory already run, and never rewrites the
  // history that references the row.
  // ---------------------------------------------------------------------

  /** Maps a unique-constraint violation to 409; rethrows anything else. */
  private static conflictOnDuplicate(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw error;
  }

  async createNeedleType(dto: CreateNeedleTypeDto): Promise<NeedleType> {
    try {
      return await this.prisma.needleType.create({
        data: {
          code: dto.code,
          name: dto.name,
          category: dto.category,
          unit: dto.unit,
          minimumStock: dto.minimumStock,
          description: dto.description,
        },
      });
    } catch (error) {
      return MasterDataService.conflictOnDuplicate(
        error,
        `Needle type code already in use: ${dto.code}`,
      );
    }
  }

  async updateNeedleType(id: string, dto: UpdateNeedleTypeDto): Promise<NeedleType> {
    await this.findNeedleType(id);
    return this.prisma.needleType.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        unit: dto.unit,
        minimumStock: dto.minimumStock,
        description: dto.description,
      },
    });
  }

  async setNeedleTypeStatus(id: string, status: EntityStatus): Promise<NeedleType> {
    await this.findNeedleType(id);
    return this.prisma.needleType.update({ where: { id }, data: { status } });
  }

  // ---------------------------------------------------------------------
  // Factory writes (`.scratch/admin-panel-crud/issues/02`)
  //
  // Deactivation does not cascade to trolleys, locations or devices — they
  // stay independently managed. FR-WEB-017's "an inactive factory takes no
  // new transactions" is enforced where transactions start (exchange create,
  // inventory writes), not here.
  // ---------------------------------------------------------------------

  /**
   * The creator is granted scope to the new factory in the same transaction.
   * Without it the row would be invisible to everyone — every factory read is
   * scope-filtered, and a brand-new factory is in nobody's scope yet — so it
   * could never be edited, staffed or reached from the TopBar switcher.
   */
  async createFactory(dto: CreateFactoryDto, user: AuthenticatedUser): Promise<Factory> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const factory = await tx.factory.create({
          data: {
            code: dto.code,
            name: dto.name,
            timezone: dto.timezone,
            description: dto.description,
          },
        });
        await tx.userFactoryScope.create({ data: { userId: user.id, factoryId: factory.id } });
        return factory;
      });
    } catch (error) {
      return MasterDataService.conflictOnDuplicate(
        error,
        `Factory code already in use: ${dto.code}`,
      );
    }
  }

  async updateFactory(
    id: string,
    dto: UpdateFactoryDto,
    user: AuthenticatedUser,
  ): Promise<Factory> {
    await this.findFactory(id, user);
    return this.prisma.factory.update({
      where: { id },
      data: { name: dto.name, timezone: dto.timezone, description: dto.description },
    });
  }

  async setFactoryStatus(
    id: string,
    status: EntityStatus,
    user: AuthenticatedUser,
  ): Promise<Factory> {
    await this.findFactory(id, user);
    return this.prisma.factory.update({ where: { id }, data: { status } });
  }

  // ---------------------------------------------------------------------
  // Trolley writes (`.scratch/admin-panel-crud/issues/03`)
  //
  // No activate/deactivate pair is contracted for Trolley — status changes
  // go through PATCH.
  // ---------------------------------------------------------------------

  /**
   * A trolley is an inventory location (ADR-003), and `Trolley.locationId`
   * is required and unique — so creating one creates its `TROLLEY` location
   * too, atomically, under the trolley's own code.
   */
  async createTrolley(dto: CreateTrolleyDto, user: AuthenticatedUser): Promise<Trolley> {
    assertFactoryScope(user, dto.factoryId);
    const factory = MasterDataService.found(
      await this.prisma.factory.findUnique({ where: { id: dto.factoryId } }),
      'Factory',
      dto.factoryId,
    );
    if (factory.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('factoryId must be ACTIVE');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const location = await tx.location.create({
          data: {
            factoryId: dto.factoryId,
            code: dto.code,
            name: dto.name,
            locationType: LocationType.TROLLEY,
          },
        });
        return tx.trolley.create({
          data: {
            factoryId: dto.factoryId,
            locationId: location.id,
            code: dto.code,
            name: dto.name,
          },
        });
      });
    } catch (error) {
      return MasterDataService.conflictOnDuplicate(
        error,
        `Trolley code already in use: ${dto.code}`,
      );
    }
  }

  async updateTrolley(
    id: string,
    dto: UpdateTrolleyDto,
    user: AuthenticatedUser,
  ): Promise<Trolley> {
    const trolley = await this.findTrolley(id, user);

    if (dto.locationId && dto.locationId !== trolley.locationId) {
      const location = MasterDataService.found(
        await this.prisma.location.findUnique({ where: { id: dto.locationId } }),
        'Location',
        dto.locationId,
      );
      if (location.locationType !== LocationType.TROLLEY) {
        throw new BadRequestException('locationId must be a TROLLEY location');
      }
      if (location.factoryId !== trolley.factoryId) {
        throw new BadRequestException("locationId must belong to the trolley's factory");
      }
    }

    try {
      return await this.prisma.trolley.update({
        where: { id },
        data: { name: dto.name, locationId: dto.locationId, status: dto.status },
      });
    } catch (error) {
      return MasterDataService.conflictOnDuplicate(
        error,
        `Location already belongs to another trolley: ${dto.locationId}`,
      );
    }
  }
}
