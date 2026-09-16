import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockRelocationKind } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { ListAdjustmentsQueryDto, ListOperationHistoryQueryDto } from '../dto/inventory-query.dto';
import { AdjustmentEvidenceService, EvidenceWithUrl } from './adjustment-evidence.service';
import { InventoryService, PagedRows } from './inventory.service';

const RELOCATION_INCLUDE = {
  outMovement: { select: { movementNumber: true } },
  inMovement: { select: { movementNumber: true } },
} satisfies Prisma.StockRelocationInclude;

export type RelocationRow = Prisma.StockRelocationGetPayload<{
  include: typeof RELOCATION_INCLUDE;
}>;

const ADJUSTMENT_INCLUDE = {
  movement: { select: { movementNumber: true } },
  _count: { select: { evidence: true } },
} satisfies Prisma.StockAdjustmentInclude;

export type AdjustmentRow = Prisma.StockAdjustmentGetPayload<{
  include: typeof ADJUSTMENT_INCLUDE;
}>;

export type AdjustmentDetail = AdjustmentRow & { evidence: EvidenceWithUrl[] };

const NEWEST_FIRST = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

/**
 * Read side of Transfer, Return and Adjustment
 * (`.scratch/inventory-operation-history/spec.md`): one paged query per screen
 * over the operation headers the writes in `InventoryService` keep, instead of
 * regrouping OUT/IN ledger rows on the client.
 */
@Injectable()
export class InventoryHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: AdjustmentEvidenceService,
  ) {}

  async findRelocations(
    kind: StockRelocationKind,
    query: ListOperationHistoryQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<RelocationRow>> {
    const { page, pageSize, skip, take } = InventoryService.paging(query);
    const where: Prisma.StockRelocationWhereInput = {
      kind,
      factoryId: { in: InventoryService.scopedFactoryIds(user, query.factoryId) },
      OR: query.locationId
        ? [{ sourceLocationId: query.locationId }, { destinationLocationId: query.locationId }]
        : undefined,
      needleTypeId: query.needleTypeId,
      createdAt: InventoryHistoryService.createdAt(query),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockRelocation.findMany({
        where,
        include: RELOCATION_INCLUDE,
        orderBy: NEWEST_FIRST,
        skip,
        take,
      }),
      this.prisma.stockRelocation.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findRelocation(
    kind: StockRelocationKind,
    id: string,
    user: AuthenticatedUser,
  ): Promise<RelocationRow> {
    const row = await this.prisma.stockRelocation.findUnique({
      where: { id },
      include: RELOCATION_INCLUDE,
    });
    if (!row || row.kind !== kind) {
      throw new NotFoundException(
        `${kind === 'TRANSFER' ? 'Transfer' : 'Return'} not found: ${id}`,
      );
    }
    assertFactoryScope(user, row.factoryId);
    return row;
  }

  async findAdjustments(
    query: ListAdjustmentsQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<AdjustmentRow>> {
    const { page, pageSize, skip, take } = InventoryService.paging(query);
    const where: Prisma.StockAdjustmentWhereInput = {
      factoryId: { in: InventoryService.scopedFactoryIds(user, query.factoryId) },
      locationId: query.locationId,
      needleTypeId: query.needleTypeId,
      reasonCode: query.reasonCode,
      countSessionId: query.countSessionId,
      createdAt: InventoryHistoryService.createdAt(query),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockAdjustment.findMany({
        where,
        include: ADJUSTMENT_INCLUDE,
        orderBy: NEWEST_FIRST,
        skip,
        take,
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findAdjustment(id: string, user: AuthenticatedUser): Promise<AdjustmentDetail> {
    const row = await this.prisma.stockAdjustment.findUnique({
      where: { id },
      include: { ...ADJUSTMENT_INCLUDE, evidence: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) {
      throw new NotFoundException(`Adjustment not found: ${id}`);
    }
    assertFactoryScope(user, row.factoryId);

    return { ...row, evidence: await this.evidence.withUrls(row.evidence) };
  }

  private static createdAt(query: ListOperationHistoryQueryDto) {
    return query.dateFrom || query.dateTo ? { gte: query.dateFrom, lte: query.dateTo } : undefined;
  }
}
