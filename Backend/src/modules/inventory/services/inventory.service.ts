import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdjustmentReasonCode,
  EntityStatus,
  Location,
  LocationType,
  MovementType,
  Prisma,
  StockMovement,
  StockRelocationKind,
} from '@prisma/client';

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
  CreateReturnDto,
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
  referenceDocument: string | null;
  note: string | null;
  sourceBalanceQuantity: number;
  destinationBalanceQuantity: number;
  createdAt: Date;
}

export interface ReturnResult extends Omit<TransferResult, 'transferId' | 'note'> {
  returnId: string;
  reason: string;
}

/** What a Transfer and a Return both are: stock leaving one location for another. */
interface StockRelocationInput {
  factoryId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  needleTypeId: string;
  quantity: number;
  referenceDocument?: string;
}

type RelocationResult = Omit<TransferResult, 'transferId' | 'note'> & { movementGroupId: string };

/** Input to `writeAdjustment` — an Adjustment already validated by its caller. */
export interface AdjustmentWrite {
  factoryId: string;
  locationId: string;
  needleTypeId: string;
  actualQuantity: number;
  reasonCode: AdjustmentReasonCode;
  note: string | null;
  /**
   * When set, the write is refused unless the balance still equals this —
   * a count session reconciling a quantity counted earlier.
   */
  expectedSystemQuantity?: number;
  /**
   * The count session being reconciled. The movement then references the
   * session (`COUNT_SESSION`) instead of itself.
   */
  countSessionId?: string;
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
  reasonCode: AdjustmentReasonCode;
  reason: string | null;
  countSessionId: string | null;
  evidenceIds: string[];
  createdAt: Date;
}

/**
 * The Inventory ledger: balances, movement history, and the writes that
 * change them (Receiving, Transfer, Return, Adjustment). Return was added by
 * `.scratch/admin-panel-crud/issues/04`, reopening spec decision #2;
 * `reservedQuantity` stays out of scope (decision #6).
 *
 * An INACTIVE factory takes no new stock writes (FR-WEB-017) — checked once,
 * up front, by every write.
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

  static paging(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  static scopedFactoryIds(user: AuthenticatedUser, requested?: string): string[] {
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

  /** FR-WEB-017: an inactive factory is not usable for new transactions. */
  async assertActiveFactory(factoryId: string): Promise<void> {
    const factory = await this.prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) {
      throw new NotFoundException(`Factory ${factoryId} not found`);
    }
    if (factory.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Factory is inactive');
    }
  }

  async assertActiveNeedleType(needleTypeId: string): Promise<void> {
    const needleType = await this.prisma.needleType.findUnique({ where: { id: needleTypeId } });
    if (!needleType || needleType.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Needle type not found or inactive');
    }
  }

  async assertLocationInFactory(
    locationId: string,
    factoryId: string,
    label: string,
  ): Promise<Location> {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }
    if (location.factoryId !== factoryId) {
      throw new BadRequestException(`${label} must belong to factoryId`);
    }
    return location;
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
    await this.assertActiveFactory(dto.factoryId);
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

  /**
   * Transfer and Return share one ledger shape: a compare-and-set decrement
   * at the source, an out row and an in row sharing one `referenceId`, an
   * upsert at the destination, and the `stock_relocations` header that
   * `referenceId` names. Only the kind, the note and the location-type rule
   * differ, so they differ only in the arguments to this.
   */
  private async relocateStock(
    dto: StockRelocationInput,
    kind: {
      relocation: StockRelocationKind;
      out: MovementType;
      in: MovementType;
      /** Location types the kind requires at each end, when it restricts them. */
      locationTypes?: { source: LocationType; destination: LocationType };
    },
    note: string | null,
    user: AuthenticatedUser,
  ): Promise<RelocationResult> {
    assertFactoryScope(user, dto.factoryId);
    await this.assertActiveFactory(dto.factoryId);

    if (dto.sourceLocationId === dto.destinationLocationId) {
      throw new BadRequestException('sourceLocationId and destinationLocationId must differ');
    }

    const source = await this.assertLocationInFactory(
      dto.sourceLocationId,
      dto.factoryId,
      'sourceLocationId',
    );
    const destination = await this.assertLocationInFactory(
      dto.destinationLocationId,
      dto.factoryId,
      'destinationLocationId',
    );
    const required = kind.locationTypes;
    if (
      required &&
      (source.locationType !== required.source || destination.locationType !== required.destination)
    ) {
      throw new BadRequestException(
        `A ${kind.relocation.toLowerCase()} must go from a ${required.source} location to a ${required.destination} location`,
      );
    }
    await this.assertActiveNeedleType(dto.needleTypeId);

    const referenceDocument = dto.referenceDocument?.trim() || null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Compare-and-set: mirrors `ExchangeService.issueNeedle` so two
        // concurrent writes cannot both pass and drive the source negative.
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

        const movementGroupId = randomUUID();
        const outMovementId = randomUUID();
        const inMovementId = randomUUID();
        const outNumber = await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx);
        const inNumber = await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx);

        await tx.stockMovement.create({
          data: {
            id: outMovementId,
            movementNumber: outNumber,
            movementType: kind.out,
            factoryId: dto.factoryId,
            sourceLocationId: dto.sourceLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: dto.quantity,
            referenceType: kind.relocation,
            referenceId: movementGroupId,
            reason: note,
            createdBy: user.id,
          },
        });

        await tx.stockMovement.create({
          data: {
            id: inMovementId,
            movementNumber: inNumber,
            movementType: kind.in,
            factoryId: dto.factoryId,
            destinationLocationId: dto.destinationLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: dto.quantity,
            referenceType: kind.relocation,
            referenceId: movementGroupId,
            reason: note,
            createdBy: user.id,
          },
        });

        const relocation = await tx.stockRelocation.create({
          data: {
            id: movementGroupId,
            kind: kind.relocation,
            factoryId: dto.factoryId,
            sourceLocationId: dto.sourceLocationId,
            destinationLocationId: dto.destinationLocationId,
            needleTypeId: dto.needleTypeId,
            quantity: dto.quantity,
            outMovementId,
            inMovementId,
            referenceDocument,
            note,
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
          movementGroupId,
          outMovementNumber: outNumber,
          inMovementNumber: inNumber,
          factoryId: dto.factoryId,
          sourceLocationId: dto.sourceLocationId,
          destinationLocationId: dto.destinationLocationId,
          needleTypeId: dto.needleTypeId,
          quantity: dto.quantity,
          referenceDocument,
          sourceBalanceQuantity: Number(sourceBalance.quantity),
          destinationBalanceQuantity: Number(destinationBalance.quantity),
          createdAt: relocation.createdAt,
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

  async transferStock(dto: CreateTransferDto, user: AuthenticatedUser): Promise<TransferResult> {
    const note = dto.note || null;
    const { movementGroupId, ...moved } = await this.relocateStock(
      dto,
      {
        relocation: StockRelocationKind.TRANSFER,
        out: MovementType.TRANSFER_OUT,
        in: MovementType.TRANSFER_IN,
      },
      note,
      user,
    );
    return { transferId: movementGroupId, ...moved, note };
  }

  // -------------------------------------------------------------------------
  // POST /inventory/returns
  // -------------------------------------------------------------------------

  /** Trolley back to warehouse only (`.scratch/inventory-operation-history/spec.md` decision 2). */
  async returnStock(dto: CreateReturnDto, user: AuthenticatedUser): Promise<ReturnResult> {
    const { movementGroupId, ...moved } = await this.relocateStock(
      dto,
      {
        relocation: StockRelocationKind.RETURN,
        out: MovementType.RETURN,
        in: MovementType.RETURN,
        locationTypes: { source: LocationType.TROLLEY, destination: LocationType.WAREHOUSE },
      },
      dto.reason,
      user,
    );
    return { returnId: movementGroupId, ...moved, reason: dto.reason };
  }

  // -------------------------------------------------------------------------
  // POST /inventory/adjustments
  // -------------------------------------------------------------------------

  /**
   * A manual adjustment must cite at least one evidence file the caller
   * uploaded for this factory and no other adjustment has claimed. The claim
   * happens inside the balance transaction, so a lost race or a bad id rolls
   * the whole adjustment back.
   */
  async adjustStock(dto: CreateAdjustmentDto, user: AuthenticatedUser): Promise<AdjustmentResult> {
    assertFactoryScope(user, dto.factoryId);
    await this.assertActiveFactory(dto.factoryId);
    await this.assertLocationInFactory(dto.locationId, dto.factoryId, 'locationId');
    await this.assertActiveNeedleType(dto.needleTypeId);

    const note = dto.reason?.trim() || null;
    if (dto.reasonCode === AdjustmentReasonCode.OTHER && !note) {
      throw new BadRequestException('reason is required when reasonCode is OTHER');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const result = await this.writeAdjustment(
          tx,
          {
            factoryId: dto.factoryId,
            locationId: dto.locationId,
            needleTypeId: dto.needleTypeId,
            actualQuantity: dto.actualQuantity,
            reasonCode: dto.reasonCode,
            note,
          },
          user,
        );

        const { count } = await tx.stockAdjustmentEvidence.updateMany({
          where: {
            id: { in: dto.evidenceIds },
            factoryId: dto.factoryId,
            uploadedBy: user.id,
            adjustmentId: null,
          },
          data: { adjustmentId: result.movementId },
        });
        if (count !== dto.evidenceIds.length) {
          throw new BadRequestException(
            'Every evidenceId must be a file you uploaded for this factory that no adjustment has used yet',
          );
        }

        return { ...result, evidenceIds: dto.evidenceIds };
      });
    } catch (error) {
      if (!(error instanceof ConcurrentAdjustmentError)) {
        throw error;
      }
      throw new ConflictException(error.message);
    }
  }

  /**
   * The ledger half of an Adjustment, inside the caller's transaction:
   * compare-and-set the balance to `actualQuantity`, write its ADJUSTMENT
   * row, and the `stock_adjustments` header keeping the reason code and the
   * balance before and after. Shared by `POST /inventory/adjustments` and
   * count-session reconciliation (`CountSessionService.complete`), so the
   * concurrency rules live in one place. Scope, factory, location,
   * needle-type and evidence validation are the caller's job.
   *
   * @throws ConcurrentAdjustmentError when the balance moved underneath.
   */
  async writeAdjustment(
    tx: Prisma.TransactionClient,
    input: AdjustmentWrite,
    user: AuthenticatedUser,
  ): Promise<AdjustmentResult> {
    const existing = await tx.inventoryBalance.findUnique({
      where: {
        locationId_needleTypeId: { locationId: input.locationId, needleTypeId: input.needleTypeId },
      },
    });
    const systemQuantity = existing ? Number(existing.quantity) : 0;
    if (
      input.expectedSystemQuantity !== undefined &&
      systemQuantity !== input.expectedSystemQuantity
    ) {
      throw new ConcurrentAdjustmentError(
        input.locationId,
        input.needleTypeId,
        input.expectedSystemQuantity,
      );
    }
    const varianceQuantity = input.actualQuantity - systemQuantity;

    if (existing) {
      // Optimistic compare-and-set: guards against a Receiving or Transfer
      // landing on this exact row between the read above and this write.
      const { count } = await tx.inventoryBalance.updateMany({
        where: {
          locationId: input.locationId,
          needleTypeId: input.needleTypeId,
          quantity: systemQuantity,
        },
        data: { quantity: input.actualQuantity },
      });

      if (count === 0) {
        throw new ConcurrentAdjustmentError(input.locationId, input.needleTypeId, systemQuantity);
      }
    } else {
      try {
        await tx.inventoryBalance.create({
          data: {
            factoryId: input.factoryId,
            locationId: input.locationId,
            needleTypeId: input.needleTypeId,
            quantity: input.actualQuantity,
          },
        });
      } catch (error) {
        // Two concurrent first-time adjustments on the same row race on
        // `@@unique([locationId, needleTypeId])` — the loser hits P2002
        // rather than the updateMany-count-0 path above, but it is the
        // same "changed since it was read" condition and gets the same
        // typed error so both branches map to 409 at the boundary.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConcurrentAdjustmentError(input.locationId, input.needleTypeId, systemQuantity);
        }
        throw error;
      }
    }

    const movementId = randomUUID();
    const countSessionId = input.countSessionId ?? null;

    const movement = await tx.stockMovement.create({
      data: {
        id: movementId,
        movementNumber: await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx),
        movementType: MovementType.ADJUSTMENT,
        factoryId: input.factoryId,
        sourceLocationId: varianceQuantity < 0 ? input.locationId : undefined,
        destinationLocationId: varianceQuantity >= 0 ? input.locationId : undefined,
        needleTypeId: input.needleTypeId,
        quantity: Math.abs(varianceQuantity),
        referenceType: countSessionId ? 'COUNT_SESSION' : 'ADJUSTMENT',
        referenceId: countSessionId ?? movementId,
        reason: input.note ? `${input.reasonCode}: ${input.note}` : input.reasonCode,
        createdBy: user.id,
      },
    });

    await tx.stockAdjustment.create({
      data: {
        id: movementId,
        factoryId: input.factoryId,
        locationId: input.locationId,
        needleTypeId: input.needleTypeId,
        reasonCode: input.reasonCode,
        note: input.note,
        systemQuantity,
        actualQuantity: input.actualQuantity,
        varianceQuantity,
        countSessionId,
        createdBy: user.id,
      },
    });

    return {
      movementId: movement.id,
      movementNumber: movement.movementNumber,
      factoryId: input.factoryId,
      locationId: input.locationId,
      needleTypeId: input.needleTypeId,
      systemQuantity,
      actualQuantity: input.actualQuantity,
      varianceQuantity,
      reasonCode: input.reasonCode,
      reason: input.note,
      countSessionId,
      evidenceIds: [],
      createdAt: movement.createdAt,
    };
  }
}
