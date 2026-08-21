import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { EmployeeService } from '../../../src/modules/employee/services/employee.service';
import { RfidCardService } from '../../../src/modules/rfid/services/rfid-card.service';

const FACTORY = 'factory-a';
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
    existing?: { id: string; factoryId: string; status: string } | null;
    createError?: Error;
  } = {},
) {
  const employeeCreate = options.createError
    ? jest.fn().mockRejectedValue(options.createError)
    : jest.fn().mockResolvedValue({ id: EMPLOYEE, status: 'ACTIVE' });
  const employeeUpdate = jest
    .fn()
    .mockImplementation((args: { data: Record<string, unknown> }) => ({
      id: EMPLOYEE,
      ...args.data,
    }));
  const employeeFindUnique = jest
    .fn()
    .mockResolvedValue(
      options.existing === undefined
        ? { id: EMPLOYEE, factoryId: FACTORY, status: 'ACTIVE' }
        : options.existing,
    );

  const client = { employee: { create: employeeCreate, update: employeeUpdate, findUnique: employeeFindUnique } };
  const prisma = {
    ...client,
    $transaction: jest.fn((callback: (c: typeof client) => unknown) => callback(client)),
  };

  const enroll = jest.fn().mockResolvedValue({ id: 'card-1', status: 'ACTIVE' });
  const revokeActiveCardsForEmployee = jest.fn().mockResolvedValue(undefined);
  const rfidCards = { enroll, revokeActiveCardsForEmployee };

  const service = new EmployeeService(
    prisma as unknown as PrismaService,
    rfidCards as unknown as RfidCardService,
  );

  return { service, employeeCreate, employeeUpdate, employeeFindUnique, enroll, revokeActiveCardsForEmployee };
}

const createDto = {
  employeeNumber: 'EMP-0002',
  name: 'New Operator',
  factoryId: FACTORY,
};

describe('EmployeeService.create', () => {
  it('creates the employee without enrolling a card when rfidUid is omitted', async () => {
    const { service, enroll } = build();

    await service.create(createDto, user);

    expect(enroll).not.toHaveBeenCalled();
  });

  it('enrolls the inline rfidUid inside the same transaction when present', async () => {
    const { service, enroll } = build();

    await service.create({ ...createDto, rfidUid: 'RFID001' }, user);

    expect(enroll).toHaveBeenCalledWith(EMPLOYEE, 'RFID001', user, expect.anything());
  });

  it('rejects with 409 on a duplicate employeeNumber', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    const { service } = build({ createError: p2002 });

    await expect(service.create(createDto, user)).rejects.toThrow(ConflictException);
  });
});

describe('EmployeeService.update', () => {
  it('cascades to revoke active cards when transitioning ACTIVE -> INACTIVE', async () => {
    const { service, revokeActiveCardsForEmployee } = build({
      existing: { id: EMPLOYEE, factoryId: FACTORY, status: 'ACTIVE' },
    });

    await service.update(EMPLOYEE, { status: 'INACTIVE' as never }, user);

    expect(revokeActiveCardsForEmployee).toHaveBeenCalledWith(expect.anything(), EMPLOYEE);
  });

  it('does not cascade when the employee is already INACTIVE', async () => {
    const { service, revokeActiveCardsForEmployee } = build({
      existing: { id: EMPLOYEE, factoryId: FACTORY, status: 'INACTIVE' },
    });

    await service.update(EMPLOYEE, { status: 'INACTIVE' as never }, user);

    expect(revokeActiveCardsForEmployee).not.toHaveBeenCalled();
  });

  it('does not cascade on a plain field edit that is not a deactivation', async () => {
    const { service, revokeActiveCardsForEmployee } = build({
      existing: { id: EMPLOYEE, factoryId: FACTORY, status: 'ACTIVE' },
    });

    await service.update(EMPLOYEE, { department: 'Sewing Line 2' }, user);

    expect(revokeActiveCardsForEmployee).not.toHaveBeenCalled();
  });
});
