import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';

import { PrismaService } from '../../database/prisma.service';
import { WHATSAPP_CLIENT, WhatsAppPort } from '../../integrations/whatsapp/whatsapp.port';
import { NOTIFICATION_DISPATCH_JOB, NOTIFICATION_QUEUE } from '../../jobs/notification.constants';
import {
  STUCK_REASONS,
  StuckReason,
  TEMPLATES,
  resolveTemplateVariables,
  stuckReasonText,
} from './notification.templates';

/**
 * Outbound notifications (ADR-006: one way, never a mutation trigger).
 *
 * Every `notify*` method is fire-and-forget from the caller's perspective:
 * failures are logged, never rethrown. A WhatsApp outage must not fail an
 * exchange transition on the factory floor — Docs/14 §14 keeps the
 * confirmation PENDING and the notification FAILED, it does not block the API.
 *
 * Callers must invoke these **after** their transaction commits. A queued job
 * is not rolled back with the database, so enqueuing inside a transaction
 * would announce events that never happened.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
    @Inject(WHATSAPP_CLIENT) private readonly whatsapp: WhatsAppPort,
  ) {}

  /** A BROKEN exchange lost its fragment — tell the assigned approver. */
  async notifyConfirmationRequested(confirmationId: string): Promise<void> {
    await this.safely(async () => {
      const confirmation = await this.prisma.confirmation.findUniqueOrThrow({
        where: { id: confirmationId },
        include: {
          exchange: {
            include: { factory: true, trolley: true, operator: true, oldNeedleType: true },
          },
        },
      });

      await this.enqueue({
        notificationType: NotificationType.CONFIRMATION_REQUESTED,
        recipientUserId: confirmation.requestedToUserId,
        exchangeId: confirmation.exchangeId,
        confirmationId: confirmation.id,
        templateCode: TEMPLATES.CONFIRMATION_REQUESTED,
        payload: {
          exchangeNumber: confirmation.exchange.exchangeNumber,
          factoryName: confirmation.exchange.factory.name,
          trolleyName: confirmation.exchange.trolley.name,
          operatorName: confirmation.exchange.operator?.name ?? 'Unknown',
          needleType: confirmation.exchange.oldNeedleType?.name ?? 'Unknown',
        },
      });
    }, `confirmation-requested ${confirmationId}`);
  }

  /** The approver decided — tell the PIC who is waiting. */
  async notifyConfirmationDecided(confirmationId: string): Promise<void> {
    await this.safely(async () => {
      const confirmation = await this.prisma.confirmation.findUniqueOrThrow({
        where: { id: confirmationId },
        include: { exchange: true },
      });

      await this.enqueue({
        notificationType: NotificationType.CONFIRMATION_DECIDED,
        recipientUserId: confirmation.exchange.picUserId,
        exchangeId: confirmation.exchangeId,
        confirmationId: confirmation.id,
        templateCode: TEMPLATES.CONFIRMATION_DECIDED,
        payload: {
          exchangeNumber: confirmation.exchange.exchangeNumber,
          decision: confirmation.status,
        },
      });

      // A rejection also leaves the exchange stuck, which is its own notice.
      if (confirmation.status === 'REJECTED') {
        await this.notifyExchangeStuck(
          confirmation.exchangeId,
          STUCK_REASONS.CONFIRMATION_REJECTED,
        );
      }
    }, `confirmation-decided ${confirmationId}`);
  }

  /**
   * The exchange stopped advancing — tell the PIC.
   *
   * Deliberately deduplicated per (exchange, reason): a stock-blocked issue is
   * retried by an offline-first client, and the PIC should be told once, not
   * once per attempt.
   */
  async notifyExchangeStuck(exchangeId: string, reason: StuckReason): Promise<void> {
    await this.safely(async () => {
      const exchange = await this.prisma.exchange.findUniqueOrThrow({
        where: { id: exchangeId },
        include: { trolley: true },
      });

      await this.enqueue({
        notificationType: NotificationType.EXCHANGE_STUCK,
        recipientUserId: exchange.picUserId,
        exchangeId: exchange.id,
        templateCode: TEMPLATES.EXCHANGE_STUCK,
        payload: {
          exchangeNumber: exchange.exchangeNumber,
          trolleyName: exchange.trolley.name,
          reason: stuckReasonText(reason),
        },
        dedupeSuffix: reason,
      });
    }, `exchange-stuck ${exchangeId} ${reason}`);
  }

  /**
   * Records the notification and queues its dispatch.
   *
   * The unique `dedupeKey` is what enforces Docs/14 §11 — one logical
   * notification per (subject, template, recipient). Relying on the index
   * rather than a read-then-write means two concurrent callers cannot both
   * create a row.
   */
  private async enqueue(input: {
    notificationType: NotificationType;
    recipientUserId: string;
    exchangeId?: string;
    confirmationId?: string;
    templateCode: string;
    payload: Record<string, string>;
    dedupeSuffix?: string;
  }): Promise<void> {
    const subject = input.confirmationId ?? input.exchangeId ?? 'none';
    const dedupeKey = [
      input.notificationType,
      subject,
      input.templateCode,
      input.recipientUserId,
      input.dedupeSuffix ?? '',
    ].join(':');

    let notificationId: string;

    try {
      const created = await this.prisma.notification.create({
        data: {
          notificationType: input.notificationType,
          recipientUserId: input.recipientUserId,
          exchangeId: input.exchangeId,
          confirmationId: input.confirmationId,
          templateCode: input.templateCode,
          payload: input.payload,
          dedupeKey,
          status: NotificationStatus.QUEUED,
        },
      });
      notificationId = created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.debug(`Notification already queued: ${dedupeKey}`);
        return;
      }
      throw error;
    }

    await this.queue.add(
      NOTIFICATION_DISPATCH_JOB,
      { notificationId },
      {
        jobId: notificationId,
        // Docs/14 §10: three attempts with exponential backoff, then FAILED.
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 500,
      },
    );
  }

  /**
   * Sends one queued notification. Called by the worker, never inline.
   *
   * Throws on provider failure so BullMQ retries; the row is only marked
   * FAILED once the attempts are exhausted.
   */
  async dispatch(notificationId: string, finalAttempt: boolean): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { recipient: true },
    });

    if (!notification || notification.status !== NotificationStatus.QUEUED) {
      return;
    }

    const phone = notification.recipient?.phoneNumber;

    // No number is a configuration problem, not a transient one — retrying
    // would never help, so fail immediately with a reason an admin can act on.
    if (!phone) {
      await this.markFailed(notificationId, 'Recipient has no phone number on file');
      return;
    }

    // Resolved before the provider is touched, and against the template's
    // declared parameter order rather than the payload's key order. A template
    // that cannot be rendered is a permanent defect — a retry would send the
    // same broken payload — so it fails immediately, like a missing number.
    let variables: string[];
    try {
      variables = resolveTemplateVariables(
        notification.templateCode,
        notification.payload as Record<string, string> | null,
      );
    } catch (error) {
      await this.markFailed(notificationId, (error as Error).message);
      return;
    }

    try {
      const result = await this.whatsapp.sendTemplate({
        to: phone,
        templateCode: notification.templateCode,
        variables,
      });

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.SENT,
          providerMessageId: result.providerMessageId,
          recipientReference: phone,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const reason = (error as Error).message;

      if (finalAttempt) {
        await this.markFailed(notificationId, reason);
        return;
      }

      throw error;
    }
  }

  private async markFailed(notificationId: string, failureReason: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.FAILED, failureReason },
    });
  }

  /** Notification problems are logged, never propagated into a domain flow. */
  private async safely(action: () => Promise<void>, context: string): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.logger.error(`Notification failed (${context}): ${(error as Error).message}`);
    }
  }
}
