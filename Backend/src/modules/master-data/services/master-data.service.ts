import { Injectable, NotFoundException } from '@nestjs/common';
import { Employee, ExchangeType, Factory, Location, NeedleType, Trolley } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { MasterDataQueryDto, ScopedMasterDataQueryDto } from '../dto/master-data-query.dto';

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
 * Read side of master data.
 *
 * Query only. Creating and editing reference data needs `CHANGE_MASTER` audit
 * wiring and a different risk conversation; until that exists, this module
 * cannot change anything it returns.
 *
 * **Two scope classes, because the schema has two.** `Factory`, `Location`,
 * `Trolley` and `Employee` are factory-scoped and filtered at the query level.
 * `NeedleType` and `ExchangeType` have no `factoryId` column — they are
 * business-wide catalogues, and pretending otherwise would either leak or
 * silently return nothing depending on which way the mistake went.
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

  async findEmployees(
    query: ScopedMasterDataQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<Employee>> {
    const { page, pageSize, skip, take } = MasterDataService.paging(query);
    const where = {
      factoryId: { in: MasterDataService.scopedFactoryIds(user, query.factoryId) },
      status: query.status,
    };

    // `employeeNumber` is what the response exposes as `code`, so ordering
    // follows the column the client actually sees sorted.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: [{ employeeNumber: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.employee.count({ where }),
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

  async findEmployee(id: string, user: AuthenticatedUser): Promise<Employee> {
    const row = MasterDataService.found(
      await this.prisma.employee.findUnique({ where: { id } }),
      'Employee',
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
}
