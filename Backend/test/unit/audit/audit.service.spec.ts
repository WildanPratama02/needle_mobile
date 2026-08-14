import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { AuditService } from '../../../src/modules/audit/services/audit.service';

interface FindManyArgs {
  where: Record<string, unknown>;
  orderBy: Record<string, string>[];
  skip: number;
  take: number;
}

const FACTORY_A = 'factory-a';
const FACTORY_B = 'factory-b';

const viewer: AuthenticatedUser = {
  id: 'user-1',
  username: 'manager',
  name: 'Manager',
  roles: ['MANAGEMENT'],
  permissions: ['AUDIT_VIEW'],
  factoryIds: [FACTORY_A],
  locationIds: [],
};

const multiFactory: AuthenticatedUser = { ...viewer, factoryIds: [FACTORY_A, FACTORY_B] };

function build(options: { rows?: unknown[]; total?: number } = {}) {
  const findMany = jest
    .fn<Promise<unknown[]>, [FindManyArgs]>()
    .mockResolvedValue(options.rows ?? []);
  const count = jest.fn().mockResolvedValue(options.total ?? 0);

  const prisma = {
    auditLog: { findMany, count },
    // Mirrors the array form: both queries run, results in order.
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  };

  return { service: new AuditService(prisma as unknown as PrismaService), findMany, count };
}

const argsOf = (findMany: jest.Mock) => (findMany.mock.calls[0] as [FindManyArgs])[0];

describe('AuditService.findMany — scope', () => {
  it('restricts the query to the caller factory scope', async () => {
    const { service, findMany } = build();

    await service.findMany({}, viewer);

    expect(argsOf(findMany).where.factoryId).toEqual({ in: [FACTORY_A] });
  });

  it('intersects a requested factory with the scope rather than replacing it', async () => {
    const { service, findMany } = build();

    await service.findMany({ factoryId: FACTORY_B }, viewer);

    // Not in scope, so the filter narrows to nothing rather than widening.
    expect(argsOf(findMany).where.factoryId).toEqual({ in: [] });
  });

  it('honours a requested factory the caller does hold', async () => {
    const { service, findMany } = build();

    await service.findMany({ factoryId: FACTORY_B }, multiFactory);

    expect(argsOf(findMany).where.factoryId).toEqual({ in: [FACTORY_B] });
  });

  it('grants nothing to a caller with no factory scope', async () => {
    const { service, findMany } = build();

    await service.findMany({}, { ...viewer, factoryIds: [] });

    expect(argsOf(findMany).where.factoryId).toEqual({ in: [] });
  });

  // Scoping happens in the query, so nothing out of scope is ever fetched.
  it('never filters in memory', async () => {
    const { service, findMany, count } = build({ rows: [], total: 0 });

    await service.findMany({}, viewer);

    expect(argsOf(findMany).where.factoryId).toBeDefined();
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ where: argsOf(findMany).where }));
  });
});

describe('AuditService.findMany — filters', () => {
  it('passes through each documented filter', async () => {
    const { service, findMany } = build();

    await service.findMany(
      {
        actorUserId: 'actor-1',
        entityType: 'Exchange',
        entityId: 'exchange-1',
        action: 'ISSUE_NEEDLE',
      },
      viewer,
    );

    expect(argsOf(findMany).where).toMatchObject({
      actorUserId: 'actor-1',
      entityType: 'Exchange',
      entityId: 'exchange-1',
      action: 'ISSUE_NEEDLE',
    });
  });

  it('builds a bounded range from dateFrom and dateTo', async () => {
    const { service, findMany } = build();
    const dateFrom = new Date('2026-08-01T00:00:00.000Z');
    const dateTo = new Date('2026-08-31T23:59:59.000Z');

    await service.findMany({ dateFrom, dateTo }, viewer);

    expect(argsOf(findMany).where.timestamp).toEqual({ gte: dateFrom, lte: dateTo });
  });

  it('accepts an open-ended range', async () => {
    const { service, findMany } = build();
    const dateFrom = new Date('2026-08-01T00:00:00.000Z');

    await service.findMany({ dateFrom }, viewer);

    expect(argsOf(findMany).where.timestamp).toEqual({ gte: dateFrom, lte: undefined });
  });

  it('omits the timestamp filter when no dates are given', async () => {
    const { service, findMany } = build();

    await service.findMany({}, viewer);

    expect(argsOf(findMany).where.timestamp).toBeUndefined();
  });
});

describe('AuditService.findMany — ordering and pagination', () => {
  // A shared timestamp must not let rows swap places between pages.
  it('orders newest first with the id as a tiebreaker', async () => {
    const { service, findMany } = build();

    await service.findMany({}, viewer);

    expect(argsOf(findMany).orderBy).toEqual([{ timestamp: 'desc' }, { id: 'desc' }]);
  });

  it('defaults to the first page of 20', async () => {
    const { service, findMany } = build();

    await service.findMany({}, viewer);

    expect(argsOf(findMany).skip).toBe(0);
    expect(argsOf(findMany).take).toBe(20);
  });

  it('computes the offset from page and pageSize', async () => {
    const { service, findMany } = build();

    await service.findMany({ page: 3, pageSize: 25 }, viewer);

    expect(argsOf(findMany).skip).toBe(50);
    expect(argsOf(findMany).take).toBe(25);
  });

  it('caps pageSize at 100 so one request cannot drain the table', async () => {
    const { service, findMany } = build();

    const result = await service.findMany({ pageSize: 5000 }, viewer);

    expect(argsOf(findMany).take).toBe(100);
    expect(result.pageSize).toBe(100);
  });

  it('returns the page counters alongside the rows', async () => {
    const { service } = build({ rows: [{ id: 'a' }], total: 42 });

    await expect(service.findMany({ page: 2, pageSize: 10 }, viewer)).resolves.toMatchObject({
      total: 42,
      page: 2,
      pageSize: 10,
    });
  });

  it('returns an empty page rather than failing when nothing matches', async () => {
    const { service } = build({ rows: [], total: 0 });

    await expect(service.findMany({ action: 'NOTHING_MATCHES' }, viewer)).resolves.toMatchObject({
      items: [],
      total: 0,
    });
  });
});
