import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityStatus, MovementType, Prisma, StockMovement } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import {
  NumberSequenceService,
  SEQUENCE_SCOPES,
} from '../../exchange/services/number-sequence.service';
import {
  CreateAdjustmentDto,
  CreateReceivingDto,
  CreateTransferDto,
} from '../dto/inventory-request.dto';
import { ListBalancesQueryDto, ListMovementsQueryDto } from '../dto/inventory-query.dto';
import { StockStatus } from '../dto/inventory-response.dto';
import { ConcurrentAdjustmentError } from './concurrent-adjustment.error';
import { InsufficientStockError } from './insufficient-stock.error';

const MAX_PAGE_SIZE = 100;

export interface PagedRows<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BalanceRow {
  locationId: string;
  needleTypeId: string;
  quantity: number;
  reservedQuantity: number;
}

export interface TrolleyStockItem {
  needleTypeId: string;
  needleTypeCode: string;
  quantity: number;
  minimumStock: number;
  stockStatus: StockStatus;
}

export interface TrolleyStockResult {
  trolleyId: string;
  factoryId: string;
  items: TrolleyStockItem[];
}

export interface ReceivingResult {
  movementId: string;
  movementNumber: string;
  factoryId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  balanceQuantity: number;
  createdAt: Date;
}

export interface TransferResult {
  transferId: string;
  outMovementNumber: string;
  inMovementNumber: string;
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  sourceBalanceQuantity: number;
  destinationBalanceQuantity: number;
  createdAt: Date;
}

export interface AdjustmentResult {
  movementId: string;
  movementNumber: string;
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  systemQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  reason: string;
  createdAt: Date;
}

/**
 * The Inventory ledger: balances, movement history, and the three writes that
 * change them (Receiving, Transfer, Adjustment). Return, Physical Count and
 * `reservedQuantity` are out of scope this batch (spec decision #2, #6).
 *
 * Every write follows the same shape as `ExchangeService`: load and validate
 * outside the transaction, then persist the balance change and its
 * `StockMovement` row atomically inside one. Decrementing writes use the same
 * compare-and-set `updateMany` pattern as `ExchangeService.issueNeedle` so two
 * concurrent requests can never drive a balance negative.
 */
@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
  ) {}

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private static paging(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private static scopedFactoryIds(user: AuthenticatedUser, requested?: string): string[] {
    return requested ? user.factoryIds.filter((id) => id === requested) : user.factoryIds;
  }

  static stockStatus(quantity: number, minimumStock: number): StockStatus {
    if (quantity <= 0) return 'OUT';
    if (quantity <= minimumStock) return 'LOW';
    return 'NORMAL';
  }

  /** `referenceDocument` and `note` share the single `reason` column — no schema change is in scope. */
  private static combineNote(referenceDocument?: string, note?: string): string | null {
    const parts = [referenceDocument, note].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(' — ') : null;
  }

  /**
   * Resolves an optional `trolleyId` filter to its backing `locationId`
   * (ADR-003: a trolley is an inventory location), asserting factory scope on
   * the trolley itself. Rejects a caller-supplied `locationId` that
   * contradicts it rather than silently picking one.
   */
  private async resolveLocationFilter(
    user: AuthenticatedUser,
    locationId: string | undefined,
    trolleyId: string | undefined,
  ): Promise<string | undefined> {
    if (!trolleyId) {
      return locationId;
    }

    const trolley = await this.prisma.trolley.findUnique({ where: { id: trolleyId } });
    if (!trolley) {
      throw new NotFoundException(`Trolley ${trolleyId} not found`);
    }
    assertFactoryScope(user, trolley.factoryId);

    if (locationId && locationId !== trolley.locationId) {
      throw new BadRequestException("locationId does not match trolleyId's location");
    }

    return trolley.locationId;
  }

  private async assertActiveNeedleType(needleTypeId: string): Promise<void> {
    const needleType = await this.prisma.needleType.findUnique({ where: { id: needleTypeId } });
    if (!needleType || needleType.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Needle type not found or inactive');
    }
  }

  private async assertLocationInFactory(
    locationId: string,
    factoryId: string,
    label: string,
  ): Promise<void> {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }
    if (location.factoryId !== factoryId) {
      throw new BadRequestException(`${label} must belong to factoryId`);
    }
  }

  // -------------------------------------------------------------------------
  // GET /inventory/balances
  // -------------------------------------------------------------------------

  async findBalances(
    query: ListBalancesQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<BalanceRow>> {
    const { page, pageSize, skip, take } = InventoryService.paging(query);
    const scopedFactoryIds = InventoryService.scopedFactoryIds(user, query.factoryId);
    const locationId = await this.resolveLocationFilter(user, query.locationId, query.trolleyId);

    if (scopedFactoryIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }

    const conditions: Prisma.Sql[] = [Prisma.sql`ib.factory_id = ANY(${scopedFactoryIds}::uuid[])`];
    if (locationId) conditions.push(Prisma.sql`ib.location_id = ${locationId}::uuid`);
    if (query.needleTypeId)
      conditions.push(Prisma.sql`ib.needle_type_id = ${query.needleTypeId}::uuid`);
    if (query.lowStock) conditions.push(Prisma.sql`ib.quantity <= nt.minimum_stock`);
    const where = Prisma.join(conditions, ' AND ');

    const [items, countRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<BalanceRow[]>`
        SELECT
          ib.location_id AS "locationId",
          ib.needle_type_id AS "needleTypeId",
          ib.quantity::float8 AS "quantity",
          ib.reserved_quantity::float8 AS "reservedQuantity"
        FROM inventory_balances ib
        JOIN needle_types nt ON nt.id = ib.needle_type_id
        WHERE ${where}
        ORDER BY ib.location_id ASC, ib.needle_type_id ASC
        LIMIT ${take} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM inventory_balances ib
        JOIN needle_types nt ON nt.id = ib.needle_type_id
        WHERE ${where}
      `,
    ]);

    return { items, total: countRows[0]?.count ?? 0, page, pageSize };
  }

  // -------------------------------------------------------------------------
  // GET /inventory/trolleys/{trolleyId}
  // -------------------------------------------------------------------------

  async findTrolleyStock(trolleyId: string, user: AuthenticatedUser): Promise<TrolleyStockResult> {
    const trolley = await this.prisma.trolley.findUnique({ where: { id: trolleyId } });
    if (!trolley) {
      throw new NotFoundException(`Trolley ${trolleyId} not found`);
    }
    assertFactoryScope(user, trolley.factoryId);

    const balances = await this.prisma.inventoryBalance.findMany({
      where: { locationId: trolley.locationId },
      include: { needleType: true },
      orderBy: { needleType: { code: 'asc' } },
    });

    return {
      trolleyId: trolley.id,
      factoryId: trolley.factoryId,
      items: balances.map((balance) => {
        const quantity = Number(balance.quantity);
        const minimumStock = Number(balance.needleType.minimumStock);

        return {
          needleTypeId: balance.needleTypeId,
          needleTypeCode: balance.needleType.code,
          quantity,
          minimumStock,
          stockStatus: InventoryService.stockStatus(quantity, minimumStock),
        };
      }),
    };
  }

  // -------------------------------------------------------------------------
  // GET /inventory/movements
  // -------------------------------------------------------------------------

  async findMovements(
    query: ListMovementsQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<StockMovement>> {
    const { page, pageSize, skip, take } = InventoryService.paging(query);
    const scopedFactoryIds = InventoryService.scopedFactoryIds(user, query.factoryId);
    const locationId = await this.resolveLocationFilter(user, query.locationId, query.trolleyId);

    const where: Prisma.StockMovementWhereInput = {
      factoryId: { in: scopedFactoryIds },
      OR: locationId
        ? [{ sourceLocationId: locationId }, { destinationLocationId: locationId }]
        : undefined,
      needleTypeId: query.needleTypeId,
      movementType: query.movementType,
      referenceType: query.referenceType,
      referenceId: query.referenceId,
      createdAt:
        query.dateFrom || query.dateTo ? { gte: query.dateFrom, lte: query.dateTo } : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // -------------------------------------------------------------------------
  // POST /inventory/receivings
  // -------------------------------------------------------------------------

  async receiveStock(dto: CreateReceivingDto, user: AuthenticatedUser): Promise<ReceivingResult> {
    assertFactoryScope(user, dto.factoryId);
    await this.assertLocationInFactory(
      dto.destinationLocationId,
      dto.factoryId,
      'destinationLocationId',
    );
    await this.assertActiveNeedleType(dto.needleTypeId);

    return this.prisma.$transaction(async (tx) => {
      const movementId = randomUUID();

      const movement = await tx.stockMovement.create({
        data: {
          id: movementId,
          movementNumber: await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx),
          movementType: MovementType.RECEIVING,
          factoryId: dto.factoryId,
          destinationLocationId: dto.destinationLocationId,
          needleTypeId: dto.needleTypeId,
          quantity: dto.quantity,
          referenceType: 'RECEIVING',
          referenceId: movementId,
          reason: InventoryService.combineNote(dto.referenceDocument, dto.note),
          createdBy: user.id,
        },
      });

      const balance = await tx.inventoryBalance.upsert({
        where: {
          locationId_needleTypeId: {
            locationId: dto.destinationLocationId,
            needleTypeId: dto.needleTypeId,
          },
        },
        create: {
          factoryId: dto.factoryId,
          locationId: dto.destinationLocationId,
          needleTypeId: dto.needleTypeId,
          quantity: dto.quantity,
        },
        update: { quantity: { increment: dto.quantity } },
      });

      return {
        movementId: movement.id,
        movementNumber: movement.movementNumber,
        factoryId: dto.factoryId,
        destinationLocationId: dto.destinationLocationId,
        needleTypeId: dto.needleTypeId,
        quantity: dto.quantity,
        balanceQuantity: Number(balance.quantity),
        createdAt: movement.createdAt,
      };
    });
  }

  // -------------------------------------------------------------------------
  // POST /inventory/transfers
  // -------------------------------------------------------------------------

  async transferStock(dto: CreateTransferDto, user: AuthenticatedUser): Promise<TransferResult> {
    assertFactoryScope(user, dto.factoryId);

    if (dto.sourceLocationId === dto.destinationLocationId) {
      throw new BadRequestException('sourceLocationId and destinationLocationId must differ');
    }

    await this.assertLocationInFactory(dto.sourceLocationId, dto.factoryId, 'sourceLocationId');
    await this.assertLocationInFactory(
      dto.destinationLocationId,
      dto.factoryId,
      'destinationLocationId',
    );
    await this.assertActiveNeedleType(dto.needleTypeId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Compare-and-set: mirrors `ExchangeService.issueNeedle` so two
        // concurrent transfers cannot both pass and drive the source negative.
        const { count } = await tx.inventoryBalance.updateMany({
          where: {
            locationId: dto.sourceLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: { gte: dto.quantity },
          },
          data: { quantity: { decrement: dto.quantity } },
        });

        if (count === 0) {
          throw new InsufficientStockError(dto.sourceLocationId, dto.needleTypeId, dto.quantity);
        }

        const transferId = randomUUID();
        const outNumber = await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx);
        const inNumber = await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx);

        await tx.stockMovement.create({
          data: {
            movementNumber: outNumber,
            movementType: MovementType.TRANSFER_OUT,
            factoryId: dto.factoryId,
            sourceLocationId: dto.sourceLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: dto.quantity,
            referenceType: 'TRANSFER',
            referenceId: transferId,
            reason: dto.note ?? null,
            createdBy: user.id,
          },
        });

        await tx.stockMovement.create({
          data: {
            movementNumber: inNumber,
            movementType: MovementType.TRANSFER_IN,
            factoryId: dto.factoryId,
            destinationLocationId: dto.destinationLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: dto.quantity,
            referenceType: 'TRANSFER',
            referenceId: transferId,
            reason: dto.note ?? null,
            createdBy: user.id,
          },
        });

        const destinationBalance = await tx.inventoryBalance.upsert({
          where: {
            locationId_needleTypeId: {
              locationId: dto.destinationLocationId,
              needleTypeId: dto.needleTypeId,
            },
          },
          create: {
            factoryId: dto.factoryId,
            locationId: dto.destinationLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: dto.quantity,
          },
          update: { quantity: { increment: dto.quantity } },
        });

        const sourceBalance = await tx.inventoryBalance.findUniqueOrThrow({
          where: {
            locationId_needleTypeId: {
              locationId: dto.sourceLocationId,
              needleTypeId: dto.needleTypeId,
            },
          },
        });

        return {
          transferId,
          outMovementNumber: outNumber,
          inMovementNumber: inNumber,
          factoryId: dto.factoryId,
          sourceLocationId: dto.sourceLocationId,
          destinationLocationId: dto.destinationLocationId,
          needleTypeId: dto.needleTypeId,
          quantity: dto.quantity,
          sourceBalanceQuantity: Number(sourceBalance.quantity),
          destinationBalanceQuantity: Number(destinationBalance.quantity),
          createdAt: new Date(),
        };
      });
    } catch (error) {
      if (!(error instanceof InsufficientStockError)) {
        throw error;
      }
      // Mapped to HTTP only at the boundary — the request is valid and may
      // succeed once the source location is restocked (spec decision #8).
      throw new ConflictException(error.message);
    }
  }

  // -------------------------------------------------------------------------
  // POST /inventory/adjustments
  // -------------------------------------------------------------------------

  async adjustStock(dto: CreateAdjustmentDto, user: AuthenticatedUser): Promise<AdjustmentResult> {
    assertFactoryScope(user, dto.factoryId);
    await this.assertLocationInFactory(dto.locationId, dto.factoryId, 'locationId');
    await this.assertActiveNeedleType(dto.needleTypeId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.inventoryBalance.findUnique({
          where: {
            locationId_needleTypeId: { locationId: dto.locationId, needleTypeId: dto.needleTypeId },
          },
        });
        const systemQuantity = existing ? Number(existing.quantity) : 0;
        const varianceQuantity = dto.actualQuantity - systemQuantity;

        if (existing) {
          // Optimistic compare-and-set: guards against a Receiving or Transfer
          // landing on this exact row between the read above and this write.
          const { count } = await tx.inventoryBalance.updateMany({
            where: {
              locationId: dto.locationId,
              needleTypeId: dto.needleTypeId,
              quantity: systemQuantity,
            },
            data: { quantity: dto.actualQuantity },
          });

          if (count === 0) {
            throw new ConcurrentAdjustmentError(dto.locationId, dto.needleTypeId, systemQuantity);
          }
        } else {
          await tx.inventoryBalance.create({
            data: {
              factoryId: dto.factoryId,
              locationId: dto.locationId,
              needleTypeId: dto.needleTypeId,
              quantity: dto.actualQuantity,
            },
          });
        }

        const movementId = randomUUID();

        const movement = await tx.stockMovement.create({
          data: {
            id: movementId,
            movementNumber: await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx),
            movementType: MovementType.ADJUSTMENT,
            factoryId: dto.factoryId,
            sourceLocationId: varianceQuantity < 0 ? dto.locationId : undefined,
            destinationLocationId: varianceQuantity >= 0 ? dto.locationId : undefined,
            needleTypeId: dto.needleTypeId,
            quantity: Math.abs(varianceQuantity),
            referenceType: 'ADJUSTMENT',
            referenceId: movementId,
            reason: dto.reason,
            createdBy: user.id,
          },
        });

        return {
          movementId: movement.id,
          movementNumber: movement.movementNumber,
          factoryId: dto.factoryId,
          locationId: dto.locationId,
          needleTypeId: dto.needleTypeId,
          systemQuantity,
          actualQuantity: dto.actualQuantity,
          varianceQuantity,
          reason: dto.reason,
          createdAt: movement.createdAt,
        };
      });
    } catch (error) {
      if (!(error instanceof ConcurrentAdjustmentError)) {
        throw error;
      }
      throw new ConflictException(error.message);
    }
  }
}
