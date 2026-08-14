import { ExchangeState, FragmentStatus, MovementType, PrismaClient } from '@prisma/client';

/**
 * Schema-level integration tests for issue 04. The `exchange` module has no
 * endpoints yet (issue 05 owns those), so these assert the things a migration
 * can get wrong: enum membership, the uniqueness rules that make retries safe,
 * and the CHECK constraints Prisma cannot express.
 *
 * Requires `npm run db:seed` to have run against the configured database.
 */
describe('Exchange schema (e2e)', () => {
  const prisma = new PrismaClient();

  const suffix = Date.now().toString(36);
  let fixture: {
    factoryId: string;
    trolleyId: string;
    deviceId: string;
    operatorId: string;
    picUserId: string;
    needleTypeId: string;
    exchangeTypeId: string;
    locationId: string;
  };
  const createdExchangeIds: string[] = [];

  beforeAll(async () => {
    const trolley = await prisma.trolley.findFirstOrThrow();
    const device = await prisma.device.findFirstOrThrow();
    const operator = await prisma.employee.findFirstOrThrow();
    const pic = await prisma.user.findFirstOrThrow();
    const needleType = await prisma.needleType.findFirstOrThrow();
    const exchangeType = await prisma.exchangeType.findUniqueOrThrow({ where: { code: 'BROKEN' } });

    fixture = {
      factoryId: trolley.factoryId,
      trolleyId: trolley.id,
      deviceId: device.id,
      operatorId: operator.id,
      picUserId: pic.id,
      needleTypeId: needleType.id,
      exchangeTypeId: exchangeType.id,
      locationId: trolley.locationId,
    };
  });

  afterAll(async () => {
    await prisma.exchange.deleteMany({ where: { id: { in: createdExchangeIds } } });
    await prisma.stockMovement.deleteMany({ where: { referenceType: `TEST-${suffix}` } });
    await prisma.idempotencyKey.deleteMany({ where: { idempotencyKey: `key-${suffix}` } });
    await prisma.numberSequence.deleteMany({ where: { scope: `TEST-${suffix}` } });
    await prisma.$disconnect();
  });

  let counter = 0;
  const newExchange = async (overrides: Record<string, unknown> = {}) => {
    counter += 1;
    const exchange = await prisma.exchange.create({
      data: {
        exchangeNumber: `EXC-${suffix}-${counter.toString().padStart(6, '0')}`,
        clientTransactionId: `ctx-${suffix}-${counter}`,
        factoryId: fixture.factoryId,
        trolleyId: fixture.trolleyId,
        deviceId: fixture.deviceId,
        operatorId: fixture.operatorId,
        picUserId: fixture.picUserId,
        oldNeedleTypeId: fixture.needleTypeId,
        exchangeTypeId: fixture.exchangeTypeId,
        ...overrides,
      } as never,
    });
    createdExchangeIds.push(exchange.id);
    return exchange;
  };

  describe('state machine vocabulary', () => {
    // CONTEXT.md is canonical here; Docs/05 §10's DRAFT / EXCHANGE_SELECTED /
    // WAITING_CONFIRMATION / PHOTO / BLOCKED names are stale and must not exist.
    it('exposes exactly the canonical states', () => {
      expect(Object.values(ExchangeState)).toEqual([
        'CREATED',
        'OPERATOR_IDENTIFIED',
        'NEEDLE_SELECTED',
        'EXCHANGE_TYPE_SELECTED',
        'FRAGMENT_CHECK',
        'CONFIRMATION_PENDING',
        'EVIDENCE_CAPTURED',
        'NEW_NEEDLE_SELECTED',
        'NEEDLE_ISSUED',
        'USED_NEEDLE_STORED',
        'COMPLETED',
        'CANCELLED',
      ]);
    });

    it('has no stale state names', () => {
      const states: string[] = Object.values(ExchangeState);
      for (const stale of [
        'DRAFT',
        'EXCHANGE_SELECTED',
        'FRAGMENT_STATUS',
        'WAITING_CONFIRMATION',
        'PHOTO',
        'PHOTO_CAPTURED',
        'STOCK_VALIDATION',
        'ISSUE',
        'BLOCKED',
      ]) {
        expect(states).not.toContain(stale);
      }
    });

    // Docs/11 §15 suggests NOT_REQUIRED and PENDING; spec round 4 Q6 removed
    // the need for both by skipping FRAGMENT_CHECK entirely for BENT/CHANGEOVER.
    it('limits fragment status to FOUND and NOT_FOUND', () => {
      expect(Object.values(FragmentStatus)).toEqual(['FOUND', 'NOT_FOUND']);
    });

    it('defaults a new exchange to CREATED with no fragment status', async () => {
      const exchange = await newExchange();

      expect(exchange.state).toBe(ExchangeState.CREATED);
      expect(exchange.fragmentStatus).toBeNull();
      expect(exchange.completedAt).toBeNull();
      expect(exchange.cancelledAt).toBeNull();
    });
  });

  describe('idempotency guarantees', () => {
    // Docs/11 §16: the same mobile command retried yields one transaction.
    it('rejects a duplicate client transaction id from the same device', async () => {
      const first = await newExchange();

      await expect(
        newExchange({ clientTransactionId: first.clientTransactionId }),
      ).rejects.toThrow();
    });

    it('allows the same client transaction id from a different device', async () => {
      const other = await prisma.device.create({
        data: {
          deviceCode: `NM-TAB-${suffix}`,
          deviceName: 'Second tablet',
          serialNumber: `SN-${suffix}`,
          factoryId: fixture.factoryId,
          trolleyId: fixture.trolleyId,
        },
      });

      const first = await newExchange();
      const second = await newExchange({
        clientTransactionId: first.clientTransactionId,
        deviceId: other.id,
      });

      expect(second.id).not.toBe(first.id);

      await prisma.exchange.deleteMany({ where: { deviceId: other.id } });
      await prisma.device.delete({ where: { id: other.id } });
    });

    it('rejects a duplicate exchange number', async () => {
      const first = await newExchange();

      await expect(newExchange({ exchangeNumber: first.exchangeNumber })).rejects.toThrow();
    });

    // Round 4 Q7: scoped by (key, endpoint), because mobile sends one key per
    // state transition rather than one per exchange.
    it('scopes idempotency keys by endpoint, not by key alone', async () => {
      await prisma.idempotencyKey.create({
        data: {
          idempotencyKey: `key-${suffix}`,
          endpoint: 'POST /api/v1/exchanges',
          requestHash: 'hash-a',
        },
      });

      // Same key, different endpoint: a genuinely different call.
      await expect(
        prisma.idempotencyKey.create({
          data: {
            idempotencyKey: `key-${suffix}`,
            endpoint: 'POST /api/v1/exchanges/1/issue',
            requestHash: 'hash-b',
          },
        }),
      ).resolves.toBeDefined();

      // Same key and endpoint: a retry, must collide.
      await expect(
        prisma.idempotencyKey.create({
          data: {
            idempotencyKey: `key-${suffix}`,
            endpoint: 'POST /api/v1/exchanges',
            requestHash: 'hash-c',
          },
        }),
      ).rejects.toThrow();
    });

    it('keeps one number sequence row per scope and date', async () => {
      const date = new Date('2026-08-10T00:00:00.000Z');
      await prisma.numberSequence.create({ data: { scope: `TEST-${suffix}`, date } });

      await expect(
        prisma.numberSequence.create({ data: { scope: `TEST-${suffix}`, date } }),
      ).rejects.toThrow();
    });
  });

  describe('confirmations', () => {
    it('allows at most one confirmation per exchange', async () => {
      const exchange = await newExchange();

      await prisma.confirmation.create({
        data: {
          confirmationNumber: `CNF-${suffix}-A`,
          exchangeId: exchange.id,
          requestedToUserId: fixture.picUserId,
        },
      });

      await expect(
        prisma.confirmation.create({
          data: {
            confirmationNumber: `CNF-${suffix}-B`,
            exchangeId: exchange.id,
            requestedToUserId: fixture.picUserId,
          },
        }),
      ).rejects.toThrow();
    });

    // Docs/11 §19 assigns this to the backend; enforcing it in the database too
    // means no code path can record a reasonless rejection.
    it('rejects a REJECTED decision with no reason', async () => {
      const exchange = await newExchange();
      const confirmation = await prisma.confirmation.create({
        data: {
          confirmationNumber: `CNF-${suffix}-C`,
          exchangeId: exchange.id,
          requestedToUserId: fixture.picUserId,
        },
      });

      await expect(
        prisma.confirmationDecision.create({
          data: {
            confirmationId: confirmation.id,
            decision: 'REJECTED',
            decidedBy: fixture.picUserId,
          },
        }),
      ).rejects.toThrow();

      // Blank is not a reason either.
      await expect(
        prisma.confirmationDecision.create({
          data: {
            confirmationId: confirmation.id,
            decision: 'REJECTED',
            decidedBy: fixture.picUserId,
            reason: '   ',
          },
        }),
      ).rejects.toThrow();

      await expect(
        prisma.confirmationDecision.create({
          data: {
            confirmationId: confirmation.id,
            decision: 'REJECTED',
            decidedBy: fixture.picUserId,
            reason: 'Fragment not recovered after full search',
          },
        }),
      ).resolves.toBeDefined();
    });

    it('allows an APPROVED decision with no reason', async () => {
      const exchange = await newExchange();
      const confirmation = await prisma.confirmation.create({
        data: {
          confirmationNumber: `CNF-${suffix}-D`,
          exchangeId: exchange.id,
          requestedToUserId: fixture.picUserId,
        },
      });

      await expect(
        prisma.confirmationDecision.create({
          data: {
            confirmationId: confirmation.id,
            decision: 'APPROVED',
            decidedBy: fixture.picUserId,
          },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('stock movement ledger', () => {
    it('stores quantity as a positive magnitude only', async () => {
      const base = {
        movementType: MovementType.ISSUE,
        factoryId: fixture.factoryId,
        sourceLocationId: fixture.locationId,
        needleTypeId: fixture.needleTypeId,
        referenceType: `TEST-${suffix}`,
        referenceId: fixture.trolleyId,
        createdBy: fixture.picUserId,
      };

      await expect(
        prisma.stockMovement.create({
          data: { ...base, movementNumber: `MV-${suffix}-neg`, quantity: -5 },
        }),
      ).rejects.toThrow();

      await expect(
        prisma.stockMovement.create({
          data: { ...base, movementNumber: `MV-${suffix}-zero`, quantity: 0 },
        }),
      ).rejects.toThrow();

      await expect(
        prisma.stockMovement.create({
          data: { ...base, movementNumber: `MV-${suffix}-ok`, quantity: 5 },
        }),
      ).resolves.toBeDefined();
    });

    it('covers every movement type the docs define', () => {
      expect(Object.values(MovementType)).toEqual([
        'RECEIVING',
        'ISSUE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'RETURN',
        'ADJUSTMENT',
        'REVERSAL',
      ]);
    });
  });
});
