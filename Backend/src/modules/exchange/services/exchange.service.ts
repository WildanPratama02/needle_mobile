import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfirmationStatus,
  EntityStatus,
  ExchangeState,
  MovementType,
  Prisma,
} from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { STUCK_REASONS } from '../../notification/notification.templates';
import {
  CancelExchangeDto,
  CreateExchangeDto,
  IdentifyOperatorDto,
  IssueNeedleDto,
  ListExchangesQueryDto,
  RecordFragmentDto,
  SelectExchangeTypeDto,
  SelectNewNeedleDto,
} from '../dto/exchange-request.dto';
import { ExchangeRepository, ExchangeWithContext } from '../repositories/exchange.repository';
import { InsufficientStockError } from './insufficient-stock.error';
import {
  ExchangeAction,
  InvalidTransitionError,
  TransitionContext,
  requiresStockReversal,
  resolveTransition,
} from './exchange-state-machine';
import { NumberSequenceService, SEQUENCE_SCOPES } from './number-sequence.service';

/**
 * Orchestrates the exchange state machine.
 *
 * Every mutating method follows the same shape: load the exchange, ask the
 * state machine whether the move is legal, then persist inside one transaction.
 * Transition rules live in `exchange-state-machine.ts`; only the side effects
 * live here.
 */
@Injectable()
export class ExchangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchanges: ExchangeRepository,
    private readonly numbers: NumberSequenceService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private static contextOf(exchange: ExchangeWithContext): TransitionContext {
    return {
      state: exchange.state,
      exchangeTypeCode: exchange.exchangeType?.code ?? null,
      fragmentStatus: exchange.fragmentStatus,
      confirmationStatus: exchange.confirmation?.status ?? null,
    };
  }

  private async loadOrFail(id: string): Promise<ExchangeWithContext> {
    const exchange = await this.exchanges.findWithContext(id);

    if (!exchange) {
      throw new NotFoundException(`Exchange ${id} not found`);
    }

    return exchange;
  }

  /**
   * Runs the state machine and converts its error into an HTTP 409.
   *
   * A rejected transition is a conflict with current state, not malformed
   * input — the request may become valid once the exchange moves on.
   */
  private static plan(action: ExchangeAction, exchange: ExchangeWithContext): ExchangeState[] {
    try {
      return resolveTransition(action, ExchangeService.contextOf(exchange));
    } catch (error) {
      if (error instanceof InvalidTransitionError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // POST /exchanges
  // -------------------------------------------------------------------------

  async create(dto: CreateExchangeDto, user: AuthenticatedUser): Promise<ExchangeWithContext> {
    assertFactoryScope(user, dto.factoryId);

    // Mobile retries the same command (ADR-005); return the original rather
    // than colliding on UNIQUE(device_id, client_transaction_id).
    const existing = await this.exchanges.findByClientTransaction(
      dto.deviceId,
      dto.clientTransactionId,
    );
    if (existing) {
      return existing;
    }

    const [trolley, device] = await Promise.all([
      this.prisma.trolley.findUnique({ where: { id: dto.trolleyId } }),
      this.prisma.device.findUnique({ where: { id: dto.deviceId } }),
    ]);

    if (!trolley || trolley.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Trolley not found or inactive');
    }
    if (!device || device.status !== 'ACTIVE') {
      throw new BadRequestException('Device not found or inactive');
    }
    if (trolley.factoryId !== dto.factoryId || device.factoryId !== dto.factoryId) {
      throw new BadRequestException('Trolley and device must belong to the given factory');
    }
    if (device.trolleyId !== dto.trolleyId) {
      throw new BadRequestException('Device is not bound to that trolley');
    }

    return this.prisma.$transaction(async (tx) => {
      const exchangeNumber = await this.numbers.next(SEQUENCE_SCOPES.EXCHANGE, tx);

      return tx.exchange.create({
        data: {
          exchangeNumber,
          clientTransactionId: dto.clientTransactionId,
          factoryId: dto.factoryId,
          trolleyId: dto.trolleyId,
          deviceId: dto.deviceId,
          picUserId: user.id,
          state: ExchangeState.CREATED,
        },
        include: { exchangeType: true, confirmation: true, evidence: true },
      });
    });
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/operator
  // -------------------------------------------------------------------------

  async identifyOperator(
    id: string,
    dto: IdentifyOperatorDto,
    user: AuthenticatedUser,
  ): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    const [target] = ExchangeService.plan('IDENTIFY_OPERATOR', exchange);

    if (!dto.employeeId && !dto.rfidUid) {
      throw new BadRequestException('Provide employeeId or rfidUid');
    }

    let employeeId = dto.employeeId;

    if (dto.rfidUid) {
      const card = await this.prisma.rfidCard.findUnique({
        where: { rfidUid: dto.rfidUid },
        include: { employee: true },
      });

      if (!card || card.status !== EntityStatus.ACTIVE || card.revokedAt) {
        throw new BadRequestException('RFID card not found, inactive, or revoked');
      }

      // Never trust a client-supplied pairing (ADR-004).
      if (employeeId && employeeId !== card.employeeId) {
        throw new BadRequestException('rfidUid does not belong to the given employeeId');
      }

      employeeId = card.employeeId;
    }

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });

    if (!employee || employee.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Operator not found or inactive');
    }
    if (employee.factoryId !== exchange.factoryId) {
      throw new BadRequestException('Operator belongs to a different factory');
    }

    return this.persist(id, target, { operatorId: employee.id });
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/type
  // -------------------------------------------------------------------------

  async selectType(
    id: string,
    dto: SelectExchangeTypeDto,
    user: AuthenticatedUser,
  ): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    // Path is NEEDLE_SELECTED then EXCHANGE_TYPE_SELECTED — both written in the
    // one transaction below, since NEEDLE_SELECTED has no endpoint (round 4 Q5).
    const path = ExchangeService.plan('SELECT_TYPE', exchange);

    const [exchangeType, needleType] = await Promise.all([
      this.prisma.exchangeType.findUnique({ where: { id: dto.exchangeTypeId } }),
      this.prisma.needleType.findUnique({ where: { id: dto.oldNeedleTypeId } }),
    ]);

    if (!exchangeType || exchangeType.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Exchange type not found or inactive');
    }
    if (!needleType || needleType.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Needle type not found or inactive');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const state of path) {
        await tx.exchange.update({
          where: { id },
          data:
            state === ExchangeState.NEEDLE_SELECTED
              ? { state, oldNeedleTypeId: needleType.id }
              : { state, exchangeTypeId: exchangeType.id },
        });
      }

      return tx.exchange.findUniqueOrThrow({
        where: { id },
        include: { exchangeType: true, confirmation: true, evidence: true },
      });
    });
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/fragment
  // -------------------------------------------------------------------------

  async recordFragment(
    id: string,
    dto: RecordFragmentDto,
    user: AuthenticatedUser,
  ): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);

    const path = ExchangeService.plan('RECORD_FRAGMENT', {
      ...exchange,
      fragmentStatus: dto.fragmentStatus,
    });
    const raisesConfirmation = path.includes(ExchangeState.CONFIRMATION_PENDING);

    // Resolve the approver before opening the transaction: no approver means
    // the exchange must not enter CONFIRMATION_PENDING at all (round 4 Q11).
    const approverId = raisesConfirmation ? await this.findApprover(exchange.factoryId) : undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      for (const state of path) {
        await tx.exchange.update({
          where: { id },
          data: { state, fragmentStatus: dto.fragmentStatus },
        });
      }

      if (raisesConfirmation && approverId) {
        const ttlHours = this.config.get<number>('domain.confirmationTtlHours', 24);

        await tx.confirmation.create({
          data: {
            confirmationNumber: await this.numbers.next(SEQUENCE_SCOPES.CONFIRMATION, tx),
            exchangeId: id,
            requestedToUserId: approverId,
            status: ConfirmationStatus.PENDING,
            dueAt: new Date(Date.now() + ttlHours * 3600 * 1000),
          },
        });
      }

      return tx.exchange.findUniqueOrThrow({
        where: { id },
        include: { exchangeType: true, confirmation: true, evidence: true },
      });
    });

    // After commit: a queued job is not rolled back with the database, so
    // notifying inside the transaction would announce a confirmation that
    // might never have existed.
    if (result.confirmation) {
      await this.notifications.notifyConfirmationRequested(result.confirmation.id);
    }

    return result;
  }

  /** MVP rule (round 4 Q11): any APPROVER scoped to the exchange's factory. */
  private async findApprover(factoryId: string): Promise<string> {
    const approver = await this.prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        roles: { some: { role: { code: 'APPROVER', status: 'ACTIVE' } } },
        factoryScopes: { some: { factoryId } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!approver) {
      throw new ConflictException(
        'No active APPROVER is scoped to this factory; a confirmation cannot be raised',
      );
    }

    return approver.id;
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/new-needle
  // -------------------------------------------------------------------------

  async selectNewNeedle(
    id: string,
    dto: SelectNewNeedleDto,
    user: AuthenticatedUser,
  ): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    const [target] = ExchangeService.plan('SELECT_NEW_NEEDLE', exchange);

    const needleType = await this.prisma.needleType.findUnique({ where: { id: dto.needleTypeId } });

    if (!needleType || needleType.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Needle type not found or inactive');
    }

    // Docs/12: "Backend validates active needle type and available stock."
    // Advisory only — the binding check happens atomically at /issue.
    const trolley = await this.prisma.trolley.findUniqueOrThrow({
      where: { id: exchange.trolleyId },
    });
    const balance = await this.prisma.inventoryBalance.findUnique({
      where: {
        locationId_needleTypeId: {
          locationId: trolley.locationId,
          needleTypeId: needleType.id,
        },
      },
    });

    if (!balance || balance.quantity.lessThanOrEqualTo(0)) {
      throw new ConflictException('Trolley has no stock of that needle type');
    }

    return this.persist(id, target, { newNeedleTypeId: needleType.id });
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/issue
  // -------------------------------------------------------------------------

  /**
   * Issues the new needle: decrements the trolley balance and writes the
   * matching `ISSUE` ledger entry, atomically (Docs/12 §/issue).
   *
   * Ticket 05's own text called this read-only; that was superseded — Docs/12
   * spells out "Create ISSUE movement / Decrease inventory balance" and
   * Backend/CLAUDE.md §5 forbids a balance change without a ledger row.
   */
  async issueNeedle(
    id: string,
    dto: IssueNeedleDto,
    user: AuthenticatedUser,
  ): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    const [target] = ExchangeService.plan('ISSUE_NEEDLE', exchange);

    if (!exchange.newNeedleTypeId) {
      throw new ConflictException('No new needle type selected');
    }

    const quantity = dto.quantity ?? 1;
    const trolley = await this.prisma.trolley.findUniqueOrThrow({
      where: { id: exchange.trolleyId },
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Conditional decrement: the `gte` makes this a compare-and-set, so two
        // concurrent issues cannot both pass a stock check and drive the balance
        // negative. `count === 0` means someone else got there first.
        const { count } = await tx.inventoryBalance.updateMany({
          where: {
            locationId: trolley.locationId,
            needleTypeId: exchange.newNeedleTypeId!,
            quantity: { gte: quantity },
          },
          data: { quantity: { decrement: quantity } },
        });

        if (count === 0) {
          throw new InsufficientStockError(trolley.locationId, exchange.newNeedleTypeId!, quantity);
        }

        await tx.stockMovement.create({
          data: {
            movementNumber: await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx),
            movementType: MovementType.ISSUE,
            factoryId: exchange.factoryId,
            sourceLocationId: trolley.locationId,
            needleTypeId: exchange.newNeedleTypeId!,
            quantity,
            referenceType: 'EXCHANGE',
            referenceId: exchange.id,
            createdBy: user.id,
          },
        });

        await tx.exchange.update({ where: { id }, data: { state: target } });

        return tx.exchange.findUniqueOrThrow({
          where: { id },
          include: { exchangeType: true, confirmation: true, evidence: true },
        });
      });
    } catch (error) {
      // Matched by type, so only a genuine stock shortfall triggers the notice.
      // Any other failure escaping the transaction propagates untouched.
      if (!(error instanceof InsufficientStockError)) {
        throw error;
      }

      // The transaction has already rolled back, so nothing was persisted and
      // the exchange still sits at NEW_NEEDLE_SELECTED — "Blocked" is not a
      // state (CONTEXT.md). The *attempt* still happened, though, and the PIC
      // needs to know. Notifying here rather than inside the transaction is
      // what keeps the ledger honest: no row, no job, no half-state.
      await this.notifications.notifyExchangeStuck(id, STUCK_REASONS.INSUFFICIENT_STOCK);

      // Mapped to HTTP only at the boundary: 409, since the request is valid
      // and may succeed once the trolley is restocked.
      throw new ConflictException(error.message);
    }
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/store-used-needle
  // -------------------------------------------------------------------------

  async storeUsedNeedle(id: string, user: AuthenticatedUser): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    const [target] = ExchangeService.plan('STORE_USED_NEEDLE', exchange);

    // Docs/12: the backend resolves trolley + exchange type -> storage mapping.
    // The client never names the destination.
    const mapping = await this.prisma.storageMapping.findUnique({
      where: {
        trolleyId_exchangeTypeId: {
          trolleyId: exchange.trolleyId,
          exchangeTypeId: exchange.exchangeTypeId!,
        },
      },
      include: { storageLocation: true },
    });

    if (!mapping || mapping.status !== EntityStatus.ACTIVE) {
      throw new ConflictException('No active storage mapping for this trolley and exchange type');
    }

    return this.persist(id, target, {});
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/complete
  // -------------------------------------------------------------------------

  async complete(id: string, user: AuthenticatedUser): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    const [target] = ExchangeService.plan('COMPLETE', exchange);

    // Docs/12 lists the preconditions explicitly. Reaching USED_NEEDLE_STORED
    // implies most of them, but re-checking the data means a row edited out of
    // band cannot slip through as COMPLETED.
    const missing: string[] = [];
    if (!exchange.operatorId) missing.push('operator identified');
    if (!exchange.exchangeTypeId) missing.push('exchange type selected');
    if (!exchange.oldNeedleTypeId) missing.push('old needle type selected');
    if (!exchange.newNeedleTypeId) missing.push('new needle type selected');
    if (exchange.exchangeType?.requiresFragmentValidation && !exchange.fragmentStatus) {
      missing.push('fragment status recorded');
    }
    if (exchange.confirmation && exchange.confirmation.status !== ConfirmationStatus.APPROVED) {
      missing.push('confirmation approved');
    }

    if (missing.length > 0) {
      throw new ConflictException(`Cannot complete: missing ${missing.join(', ')}`);
    }

    return this.persist(id, target, { completedAt: new Date() });
  }

  // -------------------------------------------------------------------------
  // POST /exchanges/{id}/cancel
  // -------------------------------------------------------------------------

  /**
   * Cancels from any non-terminal state (spec decision 4), including the stuck
   * ones — a rejected confirmation or a stock-blocked exchange is released
   * precisely by cancelling.
   *
   * Past `NEEDLE_ISSUED` the trolley balance was already decremented, so this
   * reverses it instead of refusing: `Trolley -1` on issue becomes `Trolley +1`
   * on reversal, and the original ISSUE row is never deleted (Docs/02 §22-23).
   */
  async cancel(
    id: string,
    dto: CancelExchangeDto,
    user: AuthenticatedUser,
  ): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    const [target] = ExchangeService.plan('CANCEL', exchange);

    const reversing = requiresStockReversal(exchange.state);

    return this.prisma.$transaction(async (tx) => {
      if (reversing) {
        await this.reverseIssuedStock(tx, exchange, dto.reason, user);
      }

      await tx.exchange.update({
        where: { id },
        data: { state: target, cancelledAt: new Date(), cancellationReason: dto.reason },
      });

      return tx.exchange.findUniqueOrThrow({
        where: { id },
        include: { exchangeType: true, confirmation: true, evidence: true },
      });
    });
  }

  /**
   * Returns everything this exchange issued back to the trolley.
   *
   * Sums the ISSUE movements rather than assuming a single one, and subtracts
   * anything already reversed so a repeated cancel cannot inflate stock — the
   * idempotency middleware replays a completed cancel, but a manual retry after
   * a crash must not double-credit.
   */
  private async reverseIssuedStock(
    tx: Prisma.TransactionClient,
    exchange: ExchangeWithContext,
    reason: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const movements = await tx.stockMovement.findMany({
      where: { referenceType: 'EXCHANGE', referenceId: exchange.id },
    });

    const issued = movements
      .filter((movement) => movement.movementType === MovementType.ISSUE)
      .reduce((total, movement) => total.plus(movement.quantity), new Prisma.Decimal(0));
    const alreadyReversed = movements
      .filter((movement) => movement.movementType === MovementType.REVERSAL)
      .reduce((total, movement) => total.plus(movement.quantity), new Prisma.Decimal(0));

    const outstanding = issued.minus(alreadyReversed);

    if (outstanding.lessThanOrEqualTo(0)) {
      return;
    }

    const trolley = await tx.trolley.findUniqueOrThrow({ where: { id: exchange.trolleyId } });

    // Stock comes back in, so the trolley is the destination here — the mirror
    // of the ISSUE, which had it as the source (Docs/11 §21).
    await tx.stockMovement.create({
      data: {
        movementNumber: await this.numbers.next(SEQUENCE_SCOPES.MOVEMENT, tx),
        movementType: MovementType.REVERSAL,
        factoryId: exchange.factoryId,
        destinationLocationId: trolley.locationId,
        needleTypeId: exchange.newNeedleTypeId!,
        quantity: outstanding,
        referenceType: 'EXCHANGE',
        referenceId: exchange.id,
        reason,
        createdBy: user.id,
      },
    });

    await tx.inventoryBalance.update({
      where: {
        locationId_needleTypeId: {
          locationId: trolley.locationId,
          needleTypeId: exchange.newNeedleTypeId!,
        },
      },
      data: { quantity: { increment: outstanding } },
    });
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async findOne(id: string, user: AuthenticatedUser): Promise<ExchangeWithContext> {
    const exchange = await this.loadOrFail(id);
    assertFactoryScope(user, exchange.factoryId);
    return exchange;
  }

  findMany(query: ListExchangesQueryDto, user: AuthenticatedUser) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const where: Prisma.ExchangeWhereInput = {
      // Never widen beyond the caller's factory scope, even without a filter.
      factoryId: query.factoryId
        ? { in: user.factoryIds.filter((id) => id === query.factoryId) }
        : { in: user.factoryIds },
      trolleyId: query.trolleyId,
      // No cast: the DTO validates against the enum, so the value that arrives
      // here is already one of its members.
      state: query.status,
    };

    return this.exchanges.findPaged(where, page, pageSize);
  }

  // -------------------------------------------------------------------------

  /**
   * `Unchecked` variant so callers can set foreign keys directly
   * (`operatorId`) rather than through nested relation writes — the ids are
   * already validated by the time they reach here.
   */
  private async persist(
    id: string,
    state: ExchangeState,
    data: Prisma.ExchangeUncheckedUpdateInput,
  ): Promise<ExchangeWithContext> {
    return this.prisma.exchange.update({
      where: { id },
      data: { ...data, state },
      include: { exchangeType: true, confirmation: true, evidence: true },
    });
  }
}
