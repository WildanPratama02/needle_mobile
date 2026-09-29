import { EntityStatus } from '@prisma/client';

import { DomainException } from '../../../src/common/errors/domain.exception';
import { PrismaService } from '../../../src/database/prisma.service';
import { RfidCardService } from '../../../src/modules/rfid/services/rfid-card.service';

const FACTORY = 'factory-a';

const employee = { id: 'employee-1', factoryId: FACTORY, status: EntityStatus.ACTIVE };

const card = (overrides: Record<string, unknown> = {}) => ({
  id: 'card-1',
  rfidUid: 'UID-1',
  status: EntityStatus.ACTIVE,
  revokedAt: null,
  employee,
  ...overrides,
});

function build(rows: unknown[]) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const service = new RfidCardService({ rfidCard: { findMany } } as unknown as PrismaService);
  return { service, findMany };
}

async function failure(promise: Promise<unknown>): Promise<DomainException> {
  return promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: DomainException) => error,
  );
}

describe('RfidCardService.findByUid', () => {
  it('prefers the ACTIVE card over a revoked predecessor sharing the UID', async () => {
    const revoked = card({ id: 'old', status: EntityStatus.INACTIVE, revokedAt: new Date() });
    const active = card({ id: 'new' });
    // Newest-first order would already put `revoked` first if it were newer.
    const { service } = build([revoked, active]);

    await expect(service.findByUid('UID-1')).resolves.toMatchObject({ id: 'new' });
  });

  it('falls back to the most recent card when none is ACTIVE', async () => {
    const { service } = build([
      card({ id: 'latest', status: EntityStatus.INACTIVE, revokedAt: new Date() }),
      card({ id: 'older', status: EntityStatus.INACTIVE, revokedAt: new Date() }),
    ]);

    await expect(service.findByUid('UID-1')).resolves.toMatchObject({ id: 'latest' });
  });

  it('returns null for an unknown UID', async () => {
    const { service } = build([]);

    await expect(service.findByUid('nope')).resolves.toBeNull();
  });
});

describe('RfidCardService.resolveForFactory', () => {
  it('returns the card and employee on the happy path', async () => {
    const { service } = build([card()]);

    await expect(service.resolveForFactory('UID-1', FACTORY)).resolves.toMatchObject({
      id: 'card-1',
      employee: { id: 'employee-1' },
    });
  });

  it.each([
    ['unknown UID', [], 404, 'RFID_NOT_FOUND'],
    [
      'revoked card',
      [card({ status: EntityStatus.INACTIVE, revokedAt: new Date() })],
      422,
      'RFID_INACTIVE',
    ],
    [
      'inactive employee',
      [card({ employee: { ...employee, status: EntityStatus.INACTIVE } })],
      422,
      'EMPLOYEE_INACTIVE',
    ],
    [
      'employee of another factory',
      [card({ employee: { ...employee, factoryId: 'factory-b' } })],
      403,
      'FACTORY_SCOPE_DENIED',
    ],
  ])('refuses a %s', async (_label, rows, status, code) => {
    const { service } = build(rows);

    const error = await failure(service.resolveForFactory('UID-1', FACTORY));
    expect(error.getStatus()).toBe(status);
    expect(error.code).toBe(code);
  });
});
