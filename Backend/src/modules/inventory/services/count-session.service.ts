import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdjustmentReasonCode, CountSession, CountSessionStatus, Prisma } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { AddCountItemDto, CreateCountSessionDto } from '../dto/inventory-request.dto';
import { ListCountSessionsQueryDto } from '../dto/inventory-query.dto';
import { ConcurrentAdjustmentError } from './concurrent-adjustment.error';
import { InventoryService, PagedRows } from './inventory.service';

const MAX_PAGE_SIZE = 100;

const DETAIL_INCLUDE = {
  items: { orderBy: { createdAt: 'asc' } },
  adjustments: {
    include: { movement: { select: { movementNumber: true } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CountSessionInclude;

export type CountSessionWithItems = Prisma.CountSessionGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export type CountSessionListRow = Prisma.CountSessionGetPayload<{
  include: { _count: { select: { items: true } } };
}>;

export interface CompletedCountSession {
  session: CountSessionWithItems;
  adjustmentMovementIds: string[];
}

/**
 * Physical Count (FR-WEB-015, `Docs/12` §14,
 * `.scratch/admin-panel-crud/issues/05`).
 *
 * A session records what was physically counted at one location; it moves no
 * stock until `complete`. Each item keeps the balance seen when it was
 * counted, and `complete` reconciles every non-zero variance through
 * `InventoryService.writeAdjustment` — the same compare-and-set ADJUSTMENT
 * write `POST /inventory/adjustments` makes — all in one transaction. If any
 * balance moved since it was counted, nothing is written and the caller is
 * told to recount: overwriting a receiving that landed mid-count would
 * silently lose it.
 *
 * No approval step: that policy is undecided
 * (`.scratch/admin-panel-crud/issues/08`), and shipped Adjustment has none.
 */
@Injectable()
export class CountSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async findMany(
    query: ListCountSessionsQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<CountSessionListRow>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    const factoryIds = query.factoryId
      ? user.factoryIds.filter((id) => id === query.factoryId)
      : user.factoryIds;
    const where = {
      factoryId: { in: factoryIds },
      locationId: query.locationId,
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.countSession.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.countSession.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<CountSessionWithItems> {
    const session = await this.prisma.countSession.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!session) {
      throw new NotFoundException(`Count session not found: ${id}`);
    }
    assertFactoryScope(user, session.factoryId);
    return session;
  }

  async create(
    dto: CreateCountSessionDto,
    user: AuthenticatedUser,
  ): Promise<CountSessionWithItems> {
    assertFactoryScope(user, dto.factoryId);
    await this.inventory.assertActiveFactory(dto.factoryId);
    await this.inventory.assertLocationInFactory(dto.locationId, dto.factoryId, 'locationId');

    return this.prisma.countSession.create({
      data: { factoryId: dto.factoryId, locationId: dto.locationId, createdBy: user.id },
      include: DETAIL_INCLUDE,
    });
  }

  async addItem(
    id: string,
    dto: AddCountItemDto,
    user: AuthenticatedUser,
  ): Promise<CountSessionWithItems> {
    const session = await this.findOne(id, user);
    CountSessionService.assertOpen(session);
    await this.inventory.assertActiveNeedleType(dto.needleTypeId);

    await this.prisma.$transaction(async (tx) => {
      // Touching the session row takes its lock, so a count cannot slip in
      // beside a concurrent `complete`: whichever commits second either sees
      // the item (complete) or sees the session already COMPLETED (here).
      const { count } = await tx.countSession.updateMany({
        where: { id, status: CountSessionStatus.OPEN },
        data: { updatedAt: new Date() },
      });
      if (count === 0) {
        throw new ConflictException('Count session is no longer open');
      }

      const balance = await tx.inventoryBalance.findUnique({
        where: {
          locationId_needleTypeId: {
            locationId: session.locationId,
            needleTypeId: dto.needleTypeId,
          },
        },
      });
      const systemQuantity = balance ? Number(balance.quantity) : 0;

      await tx.countSessionItem.upsert({
        where: {
          countSessionId_needleTypeId: { countSessionId: id, needleTypeId: dto.needleTypeId },
        },
        create: {
          countSessionId: id,
          needleTypeId: dto.needleTypeId,
          systemQuantity,
          physicalQuantity: dto.physicalQuantity,
        },
        update: { systemQuantity, physicalQuantity: dto.physicalQuantity },
      });
    });

    return this.findOne(id, user);
  }

  async complete(id: string, user: AuthenticatedUser): Promise<CompletedCountSession> {
    const session = await this.findOne(id, user);
    CountSessionService.assertOpen(session);
    if (session.items.length === 0) {
      throw new BadRequestException('Nothing has been counted in this session');
    }
    await this.inventory.assertActiveFactory(session.factoryId);

    let adjustmentMovementIds: string[];
    try {
      adjustmentMovementIds = await this.prisma.$transaction(async (tx) => {
        // Claim the session before touching stock, so two concurrent
        // completes cannot both reconcile the same count.
        const { count } = await tx.countSession.updateMany({
          where: { id, status: CountSessionStatus.OPEN },
          data: { status: CountSessionStatus.COMPLETED, completedAt: new Date() },
        });
        if (count === 0) {
          throw new ConflictException('Count session is no longer open');
        }

        // Reconcile what is counted now, under the session lock — not the
        // copy read before the transaction, which a concurrent recount may
        // already have replaced.
        const items = await tx.countSessionItem.findMany({ where: { countSessionId: id } });

        const movementIds: string[] = [];
        for (const item of items) {
          const systemQuantity = Number(item.systemQuantity);
          const physicalQuantity = Number(item.physicalQuantity);
          if (physicalQuantity === systemQuantity) {
            continue;
          }

          const adjustment = await this.inventory.writeAdjustment(
            tx,
            {
              factoryId: session.factoryId,
              locationId: session.locationId,
              needleTypeId: item.needleTypeId,
              actualQuantity: physicalQuantity,
              reasonCode: AdjustmentReasonCode.PHYSICAL_COUNT,
              note: null,
              expectedSystemQuantity: systemQuantity,
              countSessionId: id,
            },
            user,
          );
          movementIds.push(adjustment.movementId);
        }
        return movementIds;
      });
    } catch (error) {
      if (error instanceof ConcurrentAdjustmentError) {
        throw new ConflictException(
          `Stock for needle type ${error.needleTypeId} changed since it was counted; recount it before completing`,
        );
      }
      throw error;
    }

    return { session: await this.findOne(id, user), adjustmentMovementIds };
  }

  /**
   * Abandons an open session (`.scratch/inventory-operation-history/spec.md`
   * decision 6). Terminal, and moves no stock — nothing was reconciled.
   * Claimed with the same status compare-and-set as `complete`, so a cancel
   * and a complete racing each other cannot both win.
   */
  async cancel(id: string, user: AuthenticatedUser): Promise<CountSessionWithItems> {
    const session = await this.findOne(id, user);
    CountSessionService.assertOpen(session);

    const { count } = await this.prisma.countSession.updateMany({
      where: { id, status: CountSessionStatus.OPEN },
      data: { status: CountSessionStatus.CANCELLED, cancelledAt: new Date() },
    });
    if (count === 0) {
      throw new ConflictException('Count session is no longer open');
    }

    return this.findOne(id, user);
  }

  private static assertOpen(session: CountSession): void {
    if (session.status !== CountSessionStatus.OPEN) {
      throw new ConflictException(`Count session is already ${session.status.toLowerCase()}`);
    }
  }
}
