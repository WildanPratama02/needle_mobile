import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfirmationStatus } from '@prisma/client';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { ConfirmationService } from '../../../src/modules/approval/services/confirmation.service';
import { NotificationService } from '../../../src/modules/notification/notification.service';

const FACTORY_A = 'factory-a';

const approver: AuthenticatedUser = {
  id: 'approver-1',
  username: 'approver',
  name: 'Approver',
  roles: ['APPROVER'],
  permissions: ['CONFIRMATION_APPROVE', 'CONFIRMATION_REJECT'],
  factoryIds: [FACTORY_A],
  locationIds: [],
};

interface DecisionCreateCall {
  data: { decision: string; decidedBy: string; reason: string | null };
}

function buildService(options: {
  confirmation?: Record<string, unknown> | null;
  updateCount?: number;
}) {
  const decisionCreate = jest.fn<Promise<unknown>, [DecisionCreateCall]>().mockResolvedValue({});
  const updateMany = jest.fn().mockResolvedValue({ count: options.updateCount ?? 1 });

  const tx = {
    confirmation: {
      updateMany,
      findUniqueOrThrow: jest.fn().mockResolvedValue(options.confirmation),
    },
    confirmationDecision: { create: decisionCreate },
  };

  const prisma = {
    confirmation: {
      findUnique: jest.fn().mockResolvedValue(options.confirmation ?? null),
      updateMany,
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  // Notification dispatch is issue 08's concern and is asserted in its own
  // spec; here it only has to exist so the service can be constructed.
  const notifications = { notifyConfirmationDecided: jest.fn().mockResolvedValue(undefined) };

  return {
    notifications,
    service: new ConfirmationService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationService,
    ),
    prisma,
    updateMany,
    decisionCreate,
  };
}

const pending = {
  id: 'cnf-1',
  status: ConfirmationStatus.PENDING,
  exchange: { exchangeNumber: 'EXC-1', state: 'CONFIRMATION_PENDING', factoryId: FACTORY_A },
  decisions: [],
};

describe('ConfirmationService.approve / reject', () => {
  it('approves a pending confirmation and records the decider', async () => {
    const { service, decisionCreate } = buildService({ confirmation: pending });

    await service.approve('cnf-1', { reason: 'Confirmed unavailable' }, approver);

    expect(decisionCreate).toHaveBeenCalledWith({
      data: {
        confirmationId: 'cnf-1',
        decision: 'APPROVED',
        decidedBy: 'approver-1',
        reason: 'Confirmed unavailable',
      },
    });
  });

  it('allows approval without a reason', async () => {
    const { service, decisionCreate } = buildService({ confirmation: pending });

    await service.approve('cnf-1', {}, approver);

    expect(decisionCreate.mock.calls[0][0].data.reason).toBeNull();
  });

  it('records a rejection with its mandatory reason', async () => {
    const { service, decisionCreate } = buildService({ confirmation: pending });

    await service.reject('cnf-1', { reason: 'Locate the fragment first' }, approver);

    expect(decisionCreate.mock.calls[0][0].data).toMatchObject({
      decision: 'REJECTED',
      reason: 'Locate the fragment first',
    });
  });

  // Deciding does not move the exchange — evidence capture does (CONTEXT.md).
  it('never touches the exchange state', async () => {
    const { service, prisma } = buildService({ confirmation: pending });

    await service.approve('cnf-1', {}, approver);

    expect(prisma).not.toHaveProperty('exchange');
  });

  it.each([ConfirmationStatus.APPROVED, ConfirmationStatus.REJECTED, ConfirmationStatus.EXPIRED])(
    'refuses to decide a confirmation that is already %s',
    async (status) => {
      const { service } = buildService({ confirmation: { ...pending, status } });

      await expect(service.approve('cnf-1', {}, approver)).rejects.toThrow(ConflictException);
    },
  );

  // Delegates to the shared helper, so this is 403 rather than 400.
  it('refuses an approver scoped to a different factory', async () => {
    const { service } = buildService({
      confirmation: { ...pending, exchange: { ...pending.exchange, factoryId: 'factory-b' } },
    });

    await expect(service.approve('cnf-1', {}, approver)).rejects.toThrow(ForbiddenException);
  });

  it('404s an unknown confirmation', async () => {
    const { service } = buildService({ confirmation: null });

    await expect(service.approve('missing', {}, approver)).rejects.toThrow(NotFoundException);
  });

  // Two approvers deciding at once: the conditional update lets exactly one win.
  it('refuses when another approver decided first', async () => {
    const { service } = buildService({ confirmation: pending, updateCount: 0 });

    await expect(service.approve('cnf-1', {}, approver)).rejects.toThrow(/decided by someone else/);
  });
});

describe('ConfirmationService.expireOverdue', () => {
  it('expires only PENDING confirmations whose dueAt has passed', async () => {
    const { service, updateMany } = buildService({ confirmation: pending });
    const now = new Date('2026-08-10T12:00:00.000Z');

    await service.expireOverdue(now);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        status: ConfirmationStatus.PENDING,
        dueAt: { not: null, lte: now },
      },
      data: { status: ConfirmationStatus.EXPIRED },
    });
  });

  it('reports how many were expired', async () => {
    const { service } = buildService({ confirmation: pending, updateCount: 3 });

    await expect(service.expireOverdue()).resolves.toBe(3);
  });

  it('writes no decision row — nobody decided, the clock ran out', async () => {
    const { service, decisionCreate } = buildService({ confirmation: pending });

    await service.expireOverdue();

    expect(decisionCreate).not.toHaveBeenCalled();
  });
});
