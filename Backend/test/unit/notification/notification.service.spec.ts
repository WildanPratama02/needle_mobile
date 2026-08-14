import { NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';

import { PrismaService } from '../../../src/database/prisma.service';
import { NotificationService } from '../../../src/modules/notification/notification.service';
import { STUCK_REASONS, TEMPLATES } from '../../../src/modules/notification/notification.templates';

interface CreateCall {
  data: {
    dedupeKey: string;
    notificationType: NotificationType;
    recipientUserId: string;
    templateCode: string;
    payload: Record<string, string>;
  };
}

interface UpdateCall {
  data: {
    status: NotificationStatus;
    providerMessageId?: string;
    failureReason?: string;
  };
}

const EXCHANGE = {
  id: 'exchange-1',
  exchangeNumber: 'EXC-20260811-000001',
  picUserId: 'pic-1',
  trolley: { name: 'Trolley A-01' },
  factory: { name: 'Factory A' },
  operator: { name: 'Siti' },
  oldNeedleType: { name: 'DBx1 #11' },
};

const CONFIRMATION = {
  id: 'cnf-1',
  exchangeId: 'exchange-1',
  requestedToUserId: 'approver-1',
  status: 'PENDING',
  exchange: EXCHANGE,
};

function build(
  options: {
    createRejectsDuplicate?: boolean;
    notification?: Record<string, unknown> | null;
    sendRejects?: Error;
  } = {},
) {
  const create = jest.fn<Promise<{ id: string }>, [CreateCall]>();
  if (options.createRejectsDuplicate) {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
  } else {
    create.mockResolvedValue({ id: 'notification-1' });
  }

  const update = jest.fn<Promise<unknown>, [UpdateCall]>().mockResolvedValue({});
  const add = jest.fn().mockResolvedValue({});
  const sendTemplate = options.sendRejects
    ? jest.fn().mockRejectedValue(options.sendRejects)
    : jest.fn().mockResolvedValue({ providerMessageId: 'wamid.123' });

  const prisma = {
    confirmation: { findUniqueOrThrow: jest.fn().mockResolvedValue(CONFIRMATION) },
    exchange: { findUniqueOrThrow: jest.fn().mockResolvedValue(EXCHANGE) },
    notification: {
      create,
      update,
      findUnique: jest.fn().mockResolvedValue(options.notification ?? null),
    },
  };

  const service = new NotificationService(
    prisma as unknown as PrismaService,
    { add } as unknown as Queue,
    { sendTemplate },
  );

  return { service, create, update, add, sendTemplate };
}

describe('NotificationService — queueing', () => {
  it('queues a confirmation request to the assigned approver', async () => {
    const { service, create, add } = build();

    await service.notifyConfirmationRequested('cnf-1');

    expect(create.mock.calls[0][0].data).toMatchObject({
      notificationType: NotificationType.CONFIRMATION_REQUESTED,
      recipientUserId: 'approver-1',
      templateCode: TEMPLATES.CONFIRMATION_REQUESTED,
    });
    expect(add).toHaveBeenCalled();
  });

  it('queues the decision notice to the PIC, not the approver', async () => {
    const { service, create } = build();

    await service.notifyConfirmationDecided('cnf-1');

    expect(create.mock.calls[0][0].data.recipientUserId).toBe('pic-1');
  });

  it('queues a stuck notice to the PIC with the reason text', async () => {
    const { service, create } = build();

    await service.notifyExchangeStuck('exchange-1', STUCK_REASONS.INSUFFICIENT_STOCK);

    expect(create.mock.calls[0][0].data).toMatchObject({
      notificationType: NotificationType.EXCHANGE_STUCK,
      recipientUserId: 'pic-1',
    });
    expect(create.mock.calls[0][0].data.payload.reason).toMatch(/does not hold enough stock/);
  });

  // Docs/14 §11: one logical notification per subject + template + recipient.
  it('builds a dedupe key from subject, template and recipient', async () => {
    const { service, create } = build();

    await service.notifyConfirmationRequested('cnf-1');

    const key = create.mock.calls[0][0].data.dedupeKey;
    expect(key).toContain('CONFIRMATION_REQUESTED');
    expect(key).toContain('cnf-1');
    expect(key).toContain('approver-1');
  });

  it('separates stuck notices by reason so different causes both notify', async () => {
    const { service, create } = build();

    await service.notifyExchangeStuck('exchange-1', STUCK_REASONS.INSUFFICIENT_STOCK);
    await service.notifyExchangeStuck('exchange-1', STUCK_REASONS.CONFIRMATION_REJECTED);

    expect(create.mock.calls[0][0].data.dedupeKey).not.toBe(create.mock.calls[1][0].data.dedupeKey);
  });

  // A retried stock-blocked issue must not spam the PIC.
  it('swallows a duplicate and does not enqueue a second job', async () => {
    const { service, add } = build({ createRejectsDuplicate: true });

    await service.notifyExchangeStuck('exchange-1', STUCK_REASONS.INSUFFICIENT_STOCK);

    expect(add).not.toHaveBeenCalled();
  });

  // A WhatsApp problem must never fail a factory-floor transition.
  it('never throws when queueing fails', async () => {
    const { service, create } = build();
    create.mockRejectedValue(new Error('database down'));

    await expect(service.notifyConfirmationRequested('cnf-1')).resolves.toBeUndefined();
  });
});

describe('NotificationService — dispatch', () => {
  /** A complete confirmation payload — every declared variable present. */
  const queued = {
    id: 'notification-1',
    status: NotificationStatus.QUEUED,
    templateCode: TEMPLATES.CONFIRMATION_REQUESTED,
    payload: {
      exchangeNumber: 'EXC-1',
      factoryName: 'Factory A',
      trolleyName: 'Trolley A-01',
      operatorName: 'Siti',
      needleType: 'DBx1 #11',
    },
    recipient: { phoneNumber: '+6281234567890' },
  };

  it('sends and records the provider message id', async () => {
    const { service, update, sendTemplate } = build({ notification: queued });

    await service.dispatch('notification-1', false);

    // The parameters Meta receives, in the order Docs/14 §6 declares them.
    expect(sendTemplate).toHaveBeenCalledWith({
      to: '+6281234567890',
      templateCode: TEMPLATES.CONFIRMATION_REQUESTED,
      variables: ['EXC-1', 'Factory A', 'Trolley A-01', 'Siti', 'DBx1 #11'],
    });
    expect(update.mock.calls[0][0].data).toMatchObject({
      status: NotificationStatus.SENT,
      providerMessageId: 'wamid.123',
    });
  });

  it('orders parameters by the template, not by the stored payload key order', async () => {
    const { service, sendTemplate } = build({
      notification: {
        ...queued,
        payload: {
          needleType: 'DBx1 #11',
          exchangeNumber: 'EXC-1',
          operatorName: 'Siti',
          factoryName: 'Factory A',
          trolleyName: 'Trolley A-01',
        },
      },
    });

    await service.dispatch('notification-1', false);

    expect((sendTemplate.mock.calls[0] as [{ variables: string[] }])[0].variables).toEqual([
      'EXC-1',
      'Factory A',
      'Trolley A-01',
      'Siti',
      'DBx1 #11',
    ]);
  });

  // A template that cannot be rendered is permanently broken; retrying would
  // resend the same defect, so it fails at once like a missing phone number.
  it('fails immediately without calling the provider when a variable is missing', async () => {
    const { service, update, sendTemplate } = build({
      notification: { ...queued, payload: { exchangeNumber: 'EXC-1' } },
    });

    await service.dispatch('notification-1', false);

    expect(sendTemplate).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data).toMatchObject({
      status: NotificationStatus.FAILED,
      failureReason: expect.stringContaining('missing variable') as string,
    });
  });

  it('fails immediately on an unknown template code', async () => {
    const { service, update, sendTemplate } = build({
      notification: { ...queued, templateCode: 'NOT_A_TEMPLATE' },
    });

    await service.dispatch('notification-1', false);

    expect(sendTemplate).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data.failureReason).toContain('Unknown template code');
  });

  it('drops payload keys the template does not declare', async () => {
    const { service, sendTemplate } = build({
      notification: {
        ...queued,
        payload: { ...queued.payload, recipientPhone: '+6280000000000' },
      },
    });

    await service.dispatch('notification-1', false);

    const sent = (sendTemplate.mock.calls[0] as [{ variables: string[] }])[0];
    expect(sent.variables).toHaveLength(5);
    expect(sent.variables).not.toContain('+6280000000000');
  });

  it('fails immediately when the recipient has no phone number', async () => {
    const { service, update, sendTemplate } = build({
      notification: { ...queued, recipient: { phoneNumber: null } },
    });

    await service.dispatch('notification-1', false);

    expect(sendTemplate).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data).toMatchObject({
      status: NotificationStatus.FAILED,
      failureReason: expect.stringContaining('no phone number') as string,
    });
  });

  // Retryable: rethrow so BullMQ backs off rather than burying the notice.
  it('rethrows a provider failure while attempts remain', async () => {
    const { service, update } = build({
      notification: queued,
      sendRejects: new Error('provider unavailable'),
    });

    await expect(service.dispatch('notification-1', false)).rejects.toThrow('provider unavailable');
    expect(update).not.toHaveBeenCalled();
  });

  it('marks FAILED on the final attempt instead of throwing', async () => {
    const { service, update } = build({
      notification: queued,
      sendRejects: new Error('provider unavailable'),
    });

    await service.dispatch('notification-1', true);

    expect(update.mock.calls[0][0].data).toMatchObject({
      status: NotificationStatus.FAILED,
      failureReason: 'provider unavailable',
    });
  });

  it('skips a notification that is no longer QUEUED', async () => {
    const { service, sendTemplate } = build({
      notification: { ...queued, status: NotificationStatus.SENT },
    });

    await service.dispatch('notification-1', false);

    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it('skips a notification that no longer exists', async () => {
    const { service, sendTemplate } = build({ notification: null });

    await service.dispatch('missing', false);

    expect(sendTemplate).not.toHaveBeenCalled();
  });
});
