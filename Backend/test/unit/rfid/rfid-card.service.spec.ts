import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { RfidCardService } from '../../../src/modules/rfid/services/rfid-card.service';

const FACTORY = 'factory-a';
const OTHER_FACTORY = 'factory-b';
const EMPLOYEE = 'employee-1';

const user: AuthenticatedUser = {
  id: 'admin-1',
  username: 'admin',
  name: 'Admin',
  roles: ['SYSTEM_ADMIN'],
  permissions: ['MASTER_EDIT'],
  factoryIds: [FACTORY],
  locationIds: [],
};

function build(
  options: {
    employee?: { id: string; factoryId: string } | null;
    conflictCard?: { employeeId: string; employee: { name: string; employeeNumber: string } } | null;
    existingCard?: { id: string; status: string; employee: { factoryId: string } } | null;
  } = {},
) {
  const employeeFindUnique = jest
    .fn()
    .mockResolvedValue(
      options.employee === undefined ? { id: EMPLOYEE, factoryId: FACTORY } : options.employee,
    );
  const rfidCardFindFirst = jest.fn().mockResolvedValue(options.conflictCard ?? null);
  const rfidCardUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
  const rfidCardCreate = jest
    .fn()
    .mockImplementation((args: { data: Record<string, unknown> }) => ({
      id: 'card-new',
      ...args.data,
    }));
  const rfidCardFindUnique = jest.fn().mockResolvedValue(options.existingCard ?? null);
  const rfidCardUpdate = jest
    .fn()
    .mockImplementation((args: { data: Record<string, unknown> }) => ({
      id: 'card-1',
      ...args.data,
    }));

  const client = {
    employee: { findUnique: employeeFindUnique },
    rfidCard: {
      findFirst: rfidCardFindFirst,
      updateMany: rfidCardUpdateMany,
      create: rfidCardCreate,
      findUnique: rfidCardFindUnique,
      update: rfidCardUpdate,
    },
  };

  const prisma = {
    ...client,
    $transaction: jest.fn((callback: (c: typeof client) => unknown) => callback(client)),
  };

  const service = new RfidCardService(prisma as unknown as PrismaService);

  return {
    service,
    prisma,
    employeeFindUnique,
    rfidCardFindFirst,
    rfidCardUpdateMany,
    rfidCardCreate,
    rfidCardFindUnique,
    rfidCardUpdate,
  };
}

describe('RfidCardService.enroll', () => {
  it('creates an ACTIVE card for the employee', async () => {
    const { service, rfidCardCreate } = build();

    const card = await service.enroll(EMPLOYEE, 'RFID001', user);

    expect(card.status).toBe('ACTIVE');
    expect(rfidCardCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { employeeId: EMPLOYEE, rfidUid: 'RFID001', status: 'ACTIVE' },
      }),
    );
  });

  it('rejects when the employee does not exist', async () => {
    const { service } = build({ employee: null });

    await expect(service.enroll(EMPLOYEE, 'RFID001', user)).rejects.toThrow(NotFoundException);
  });

  it('rejects when the employee is outside the caller factory scope', async () => {
    const { service } = build({ employee: { id: EMPLOYEE, factoryId: OTHER_FACTORY } });

    await expect(service.enroll(EMPLOYEE, 'RFID001', user)).rejects.toThrow(ForbiddenException);
  });

  it('rejects with 409 when the UID is already ACTIVE on another card (any employee)', async () => {
    const { service, rfidCardCreate } = build({
      conflictCard: {
        employeeId: 'someone-else',
        employee: { name: 'Other Person', employeeNumber: 'EMP-9999' },
      },
    });

    await expect(service.enroll(EMPLOYEE, 'RFID001', user)).rejects.toThrow(ConflictException);
    expect(rfidCardCreate).not.toHaveBeenCalled();
  });

  it('auto-revokes the employee\'s current ACTIVE card before creating the new one', async () => {
    const { service, rfidCardUpdateMany, rfidCardCreate } = build();

    await service.enroll(EMPLOYEE, 'RFID002', user);

    expect(rfidCardUpdateMany).toHaveBeenCalledWith({
      where: { employeeId: EMPLOYEE, status: 'ACTIVE' },
      data: { status: 'INACTIVE', revokedAt: expect.any(Date) as Date },
    });
    // Revoke-then-create, not the other way around.
    expect(rfidCardUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(
      rfidCardCreate.mock.invocationCallOrder[0],
    );
  });

  it('runs inside the passed-in transaction client instead of opening its own', async () => {
    const { service, prisma, employeeFindUnique } = build();
    const tx = { employee: { findUnique: employeeFindUnique }, rfidCard: build().prisma.rfidCard };

    await service.enroll(EMPLOYEE, 'RFID003', user, tx as never);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('RfidCardService.revoke', () => {
  it('sets the card INACTIVE and stamps revokedAt', async () => {
    const { service, rfidCardUpdate } = build({
      existingCard: { id: 'card-1', status: 'ACTIVE', employee: { factoryId: FACTORY } },
    });

    const card = await service.revoke('card-1', user);

    expect(card.status).toBe('INACTIVE');
    expect(rfidCardUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'INACTIVE', revokedAt: expect.any(Date) as Date },
      }),
    );
  });

  it('rejects with 404 when the card does not exist', async () => {
    const { service } = build({ existingCard: null });

    await expect(service.revoke('missing', user)).rejects.toThrow(NotFoundException);
  });

  it('rejects with 409 when the card is already revoked — terminal, no un-revoke', async () => {
    const { service, rfidCardUpdate } = build({
      existingCard: { id: 'card-1', status: 'INACTIVE', employee: { factoryId: FACTORY } },
    });

    await expect(service.revoke('card-1', user)).rejects.toThrow(ConflictException);
    expect(rfidCardUpdate).not.toHaveBeenCalled();
  });

  it('rejects when the card belongs to an employee outside the caller factory scope', async () => {
    const { service } = build({
      existingCard: { id: 'card-1', status: 'ACTIVE', employee: { factoryId: OTHER_FACTORY } },
    });

    await expect(service.revoke('card-1', user)).rejects.toThrow(ForbiddenException);
  });
});

describe('RfidCardService.revokeActiveCardsForEmployee', () => {
  it('revokes every ACTIVE card the employee holds', async () => {
    const { service, rfidCardUpdateMany, prisma } = build();

    await service.revokeActiveCardsForEmployee(prisma as never, EMPLOYEE);

    expect(rfidCardUpdateMany).toHaveBeenCalledWith({
      where: { employeeId: EMPLOYEE, status: 'ACTIVE' },
      data: { status: 'INACTIVE', revokedAt: expect.any(Date) as Date },
    });
  });
});
