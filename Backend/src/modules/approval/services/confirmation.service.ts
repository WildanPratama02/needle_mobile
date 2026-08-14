import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfirmationDecisionType, ConfirmationStatus, Prisma } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import {
  ApproveConfirmationDto,
  ListConfirmationsQueryDto,
  RejectConfirmationDto,
} from '../dto/confirmation-request.dto';

const CONFIRMATION_INCLUDE = {
  exchange: { select: { exchangeNumber: true, state: true, factoryId: true } },
  decisions: { orderBy: { decidedAt: 'asc' } },
} satisfies Prisma.ConfirmationInclude;

export type ConfirmationWithContext = Prisma.ConfirmationGetPayload<{
  include: typeof CONFIRMATION_INCLUDE;
}>;

/**
 * The Confirmation lifecycle: `PENDING -> APPROVED / REJECTED / EXPIRED`.
 *
 * Deciding a Confirmation never moves the Exchange. An approved exchange still
 * sits at `CONFIRMATION_PENDING` until evidence is captured, and a rejected one
 * sits there permanently until someone cancels it — "Blocked" is a description
 * of that stuck condition, not a state (CONTEXT.md).
 */
@Injectable()
export class ConfirmationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  private async loadOrFail(id: string): Promise<ConfirmationWithContext> {
    const confirmation = await this.prisma.confirmation.findUnique({
      where: { id },
      include: CONFIRMATION_INCLUDE,
    });

    if (!confirmation) {
      throw new NotFoundException(`Confirmation ${id} not found`);
    }

    return confirmation;
  }

  /**
   * Any approver scoped to the exchange's factory may decide.
   *
   * `requestedToUserId` records who was notified (round 4 Q11), not the only
   * person permitted to answer — tying the decision to one account would stall
   * every exchange whenever that person is off shift. The actual decider is
   * recorded on the decision row.
   */
  private static assertCanDecide(user: AuthenticatedUser, factoryId: string): void {
    assertFactoryScope(user, factoryId);
  }

  private static assertPending(confirmation: ConfirmationWithContext): void {
    if (confirmation.status !== ConfirmationStatus.PENDING) {
      throw new ConflictException(
        `Confirmation is already ${confirmation.status} and cannot be decided again`,
      );
    }
  }

  approve(
    id: string,
    dto: ApproveConfirmationDto,
    user: AuthenticatedUser,
  ): Promise<ConfirmationWithContext> {
    return this.decide(id, ConfirmationDecisionType.APPROVED, dto.reason ?? null, user);
  }

  reject(
    id: string,
    dto: RejectConfirmationDto,
    user: AuthenticatedUser,
  ): Promise<ConfirmationWithContext> {
    return this.decide(id, ConfirmationDecisionType.REJECTED, dto.reason, user);
  }

  private async decide(
    id: string,
    decision: ConfirmationDecisionType,
    reason: string | null,
    user: AuthenticatedUser,
  ): Promise<ConfirmationWithContext> {
    const confirmation = await this.loadOrFail(id);
    ConfirmationService.assertCanDecide(user, confirmation.exchange.factoryId);
    ConfirmationService.assertPending(confirmation);

    const decided = await this.prisma.$transaction(async (tx) => {
      // Conditional update, so two approvers deciding at once cannot both
      // record a decision — the loser sees zero rows and is told why.
      const { count } = await tx.confirmation.updateMany({
        where: { id, status: ConfirmationStatus.PENDING },
        data: {
          status:
            decision === ConfirmationDecisionType.APPROVED
              ? ConfirmationStatus.APPROVED
              : ConfirmationStatus.REJECTED,
          decidedAt: new Date(),
        },
      });

      if (count === 0) {
        throw new ConflictException('Confirmation was decided by someone else');
      }

      await tx.confirmationDecision.create({
        data: { confirmationId: id, decision, decidedBy: user.id, reason },
      });

      return tx.confirmation.findUniqueOrThrow({ where: { id }, include: CONFIRMATION_INCLUDE });
    });

    // After commit — a queued job survives a rollback, so announcing a
    // decision from inside the transaction could report one that never landed.
    await this.notifications.notifyConfirmationDecided(id);

    return decided;
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<ConfirmationWithContext> {
    const confirmation = await this.loadOrFail(id);
    ConfirmationService.assertCanDecide(user, confirmation.exchange.factoryId);
    return confirmation;
  }

  async findMany(query: ListConfirmationsQueryDto, user: AuthenticatedUser) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const where: Prisma.ConfirmationWhereInput = {
      status: query.status,
      exchange: {
        // Never widen past the caller's scope, with or without a filter.
        factoryId: query.factoryId
          ? { in: user.factoryIds.filter((id) => id === query.factoryId) }
          : { in: user.factoryIds },
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.confirmation.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: CONFIRMATION_INCLUDE,
      }),
      this.prisma.confirmation.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * Expires every PENDING confirmation whose `dueAt` has passed.
   *
   * No `confirmation_decisions` row is written: nobody decided, the clock ran
   * out. That is also why `AuditLog.actorUserId` is nullable — this runs with
   * no human actor.
   *
   * Written as a sweep rather than one timer per confirmation so a restart or
   * an outage cannot leave a confirmation pending forever.
   */
  async expireOverdue(now: Date = new Date()): Promise<number> {
    const { count } = await this.prisma.confirmation.updateMany({
      where: {
        status: ConfirmationStatus.PENDING,
        dueAt: { not: null, lte: now },
      },
      data: { status: ConfirmationStatus.EXPIRED },
    });

    return count;
  }
}
