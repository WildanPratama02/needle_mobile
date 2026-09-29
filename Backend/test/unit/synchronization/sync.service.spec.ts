import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ExchangeState } from '@prisma/client';

import { AuditWriter } from '../../../src/common/audit/audit-writer';
import { DomainException } from '../../../src/common/errors/domain.exception';
import {
  ClaimRequest,
  ClaimResult,
  IdempotencyStore,
} from '../../../src/common/idempotency/idempotency-store';
import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { DeviceContext } from '../../../src/common/interfaces/device-context.interface';
import { ExchangeRepository } from '../../../src/modules/exchange/repositories/exchange.repository';
import { ExchangeService } from '../../../src/modules/exchange/services/exchange.service';
import { SyncCommandDto } from '../../../src/modules/synchronization/dto/mobile-request.dto';
import { BootstrapService } from '../../../src/modules/synchronization/services/bootstrap.service';
import { SyncChangesService } from '../../../src/modules/synchronization/services/sync-changes.service';
import { SyncService } from '../../../src/modules/synchronization/services/sync.service';

const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

const user: AuthenticatedUser = {
  id: 'pic-1',
  username: 'pic',
  name: 'PIC',
  roles: ['PIC_TROLI'],
  permissions: [
    'MOBILE_OPERATE',
    'EXCHANGE_CREATE',
    'EXCHANGE_ISSUE',
    'EXCHANGE_COMPLETE',
    'EXCHANGE_CANCEL',
  ],
  factoryIds: ['factory-a'],
  locationIds: [],
};

const device = {
  device: { id: DEVICE_ID, factoryId: 'factory-a', trolleyId: 'trolley-1' },
  factory: { id: 'factory-a' },
  trolley: { id: 'trolley-1', locationId: 'loc-1' },
} as unknown as DeviceContext;

const exchangeRow = (clientTransactionId: string, state: ExchangeState) => ({
  id: `server-${clientTransactionId}`,
  exchangeNumber: `EXC-${clientTransactionId}`,
  clientTransactionId,
  state,
  factoryId: 'factory-a',
  trolleyId: 'trolley-1',
  deviceId: DEVICE_ID,
  operatorId: null,
  exchangeTypeId: null,
  oldNeedleTypeId: null,
  newNeedleTypeId: null,
  fragmentStatus: null,
  createdAt: new Date(),
  completedAt: null,
  cancelledAt: null,
  exchangeType: null,
  confirmation: null,
  evidence: [],
});

/** An in-memory stand-in for the idempotency table, same outcomes as the real one. */
class FakeStore {
  rows = new Map<string, { hash: string; body?: unknown }>();
  released: string[] = [];

  claim(request: ClaimRequest): Promise<ClaimResult> {
    const id = `${request.key}|${request.endpoint}`;
    const row = this.rows.get(id);
    if (!row) {
      this.rows.set(id, { hash: request.requestHash });
      return Promise.resolve({ outcome: 'CLAIMED' });
    }
    if (row.hash !== request.requestHash) return Promise.resolve({ outcome: 'MISMATCH' });
    if (row.body === undefined) return Promise.resolve({ outcome: 'IN_PROGRESS' });
    return Promise.resolve({ outcome: 'REPLAY', responseStatus: 200, responseBody: row.body });
  }

  complete(key: string, endpoint: string, _status: number, body: unknown): Promise<void> {
    this.rows.get(`${key}|${endpoint}`)!.body = body;
    return Promise.resolve();
  }

  release(key: string, endpoint: string): Promise<void> {
    this.rows.delete(`${key}|${endpoint}`);
    this.released.push(key);
    return Promise.resolve();
  }
}

function build(
  options: {
    fail?: Partial<Record<string, Error>>;
    permissions?: string[];
  } = {},
) {
  const states = new Map<string, ReturnType<typeof exchangeRow>>();
  const calls: string[] = [];

  const step =
    (name: string, state: ExchangeState) =>
    (id: string): Promise<ReturnType<typeof exchangeRow>> => {
      const ctid = id.replace('server-', '');
      calls.push(`${name}:${ctid}`);
      const failure = options.fail?.[`${name}:${ctid}`];
      if (failure) return Promise.reject(failure);
      const row = exchangeRow(ctid, state);
      states.set(ctid, row);
      return Promise.resolve(row);
    };

  const exchanges = {
    create: (dto: { clientTransactionId: string }) =>
      step('create', ExchangeState.CREATED)(`server-${dto.clientTransactionId}`),
    identifyOperator: step('operator', ExchangeState.OPERATOR_IDENTIFIED),
    selectType: step('type', ExchangeState.EXCHANGE_TYPE_SELECTED),
    recordFragment: step('fragment', ExchangeState.FRAGMENT_CHECK),
    selectNewNeedle: step('newNeedle', ExchangeState.NEW_NEEDLE_SELECTED),
    issueNeedle: step('issue', ExchangeState.NEEDLE_ISSUED),
    storeUsedNeedle: step('store', ExchangeState.USED_NEEDLE_STORED),
    complete: step('complete', ExchangeState.COMPLETED),
    cancel: step('cancel', ExchangeState.CANCELLED),
  };

  const repository = {
    findByClientTransaction: (_device: string, ctid: string) =>
      Promise.resolve(states.get(ctid) ?? null),
  };

  const store = new FakeStore();
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const changes = {
    changesSince: jest
      .fn()
      .mockResolvedValue({ exchanges: [], hasMore: false, nextCursor: 'next-cursor' }),
  };
  const bootstrap = {
    catalogue: jest.fn().mockResolvedValue({
      versions: { needleTypes: 'n', exchangeTypes: 'e', storageMappings: 's' },
    }),
  };

  const service = new SyncService(
    exchanges as unknown as ExchangeService,
    repository as unknown as ExchangeRepository,
    store as unknown as IdempotencyStore,
    audit as unknown as AuditWriter,
    changes as unknown as SyncChangesService,
    bootstrap as unknown as BootstrapService,
  );

  const call = {
    user: options.permissions ? { ...user, permissions: options.permissions } : user,
    device,
    requestId: 'req-1',
    path: '/api/v1/mobile/sync',
  };

  const sync = (commands: SyncCommandDto[], cursor?: string) =>
    service.sync({ deviceId: DEVICE_ID, cursor, commands }, call);

  return { sync, service, call, calls, store, audit, changes };
}

let sequence = 0;
const cmd = (
  clientTransactionId: string,
  commandType: SyncCommandDto['commandType'],
  payload: Record<string, unknown> = {},
): SyncCommandDto => ({
  commandId: `cmd-${++sequence}`,
  clientTransactionId,
  commandType,
  payload,
});

const NEEDLE = '22222222-2222-4222-8222-222222222222';

describe('SyncService', () => {
  it('runs commands in order and reports each with the authoritative state', async () => {
    const { sync, calls } = build();

    const response = await sync([
      cmd('ex-1', 'CREATE_EXCHANGE'),
      cmd('ex-1', 'ASSIGN_OPERATOR', { rfidUid: 'UID-1' }),
      cmd('ex-1', 'SELECT_NEW_NEEDLE', { needleTypeId: NEEDLE }),
      cmd('ex-1', 'ISSUE_NEEDLE', { quantity: 1 }),
    ]);

    expect(calls).toEqual(['create:ex-1', 'operator:ex-1', 'newNeedle:ex-1', 'issue:ex-1']);
    expect(response.results.map((r) => r.status)).toEqual([
      'SUCCESS',
      'SUCCESS',
      'SUCCESS',
      'SUCCESS',
    ]);
    expect(response.results[3]).toMatchObject({
      referenceId: 'server-ex-1',
      exchange: { status: 'NEEDLE_ISSUED', clientTransactionId: 'ex-1' },
    });
    expect(response.nextCursor).toBe('next-cursor');
    expect(response.changes.masterDataVersions).toEqual({
      needleTypes: 'n',
      exchangeTypes: 'e',
      storageMappings: 's',
    });
  });

  it('audits exactly the commands whose HTTP routes are audited', async () => {
    const { sync, audit } = build();

    await sync([
      cmd('ex-1', 'CREATE_EXCHANGE'),
      cmd('ex-1', 'ASSIGN_OPERATOR', { rfidUid: 'UID-1' }),
      cmd('ex-1', 'ISSUE_NEEDLE'),
      cmd('ex-1', 'CANCEL_EXCHANGE', { reason: 'wrong needle' }),
    ]);

    expect(audit.write.mock.calls.map(([record]: [{ action: string }]) => record.action)).toEqual([
      'CREATE_EXCHANGE',
      'ISSUE_NEEDLE',
      'CANCEL_EXCHANGE',
    ]);
    expect(audit.write).toHaveBeenLastCalledWith(
      expect.objectContaining({
        actorUserId: 'pic-1',
        requestId: 'req-1',
        metadata: expect.objectContaining({
          source: 'MOBILE_SYNC',
          deviceId: DEVICE_ID,
          reason: 'wrong needle',
        }) as unknown,
      }),
    );
  });

  it('skips the rest of a rejected exchange while other exchanges continue', async () => {
    const stockError = new DomainException('INVENTORY_INSUFFICIENT_STOCK', 'No stock', 409, {
      availableQuantity: 0,
    });
    const { sync, calls, store } = build({ fail: { 'issue:ex-1': stockError } });

    const response = await sync([
      cmd('ex-1', 'CREATE_EXCHANGE'),
      cmd('ex-2', 'CREATE_EXCHANGE'),
      cmd('ex-1', 'ISSUE_NEEDLE'),
      cmd('ex-1', 'STORE_USED_NEEDLE'),
      cmd('ex-2', 'ASSIGN_OPERATOR', { rfidUid: 'UID-2' }),
    ]);

    expect(response.results.map((r) => r.status)).toEqual([
      'SUCCESS',
      'SUCCESS',
      'REJECTED',
      'SKIPPED',
      'SUCCESS',
    ]);
    expect(response.results[2]).toMatchObject({
      error: { code: 'INVENTORY_INSUFFICIENT_STOCK', context: { availableQuantity: 0 } },
      // The tablet refreshes from the state the server actually holds.
      exchange: { status: 'CREATED' },
    });
    expect(calls).not.toContain('store:ex-1');
    // A rejection is not remembered: a resend is evaluated again.
    expect(store.released).toContain(response.results[2].commandId);
  });

  it('replays a command already executed instead of running it twice', async () => {
    const { sync, calls } = build();
    const batch = [cmd('ex-1', 'CREATE_EXCHANGE'), cmd('ex-1', 'ISSUE_NEEDLE')];

    await sync(batch);
    const retry = await sync(batch);

    expect(calls).toEqual(['create:ex-1', 'issue:ex-1']);
    expect(retry.results.map((r) => r.status)).toEqual([
      'IDEMPOTENT_SUCCESS',
      'IDEMPOTENT_SUCCESS',
    ]);
    expect(retry.results[1].exchange).toMatchObject({ status: 'NEEDLE_ISSUED' });
  });

  it('rejects a reused commandId carrying a different command', async () => {
    const { sync } = build();
    const first = cmd('ex-1', 'CREATE_EXCHANGE');

    await sync([first]);
    const response = await sync([{ ...first, clientTransactionId: 'ex-other' }]);

    expect(response.results[0]).toMatchObject({
      status: 'REJECTED',
      error: { code: 'IDEMPOTENCY_KEY_REUSED' },
    });
  });

  it('refuses a command whose HTTP permission the caller lacks', async () => {
    const { sync, calls } = build({ permissions: ['MOBILE_OPERATE', 'EXCHANGE_CREATE'] });

    const response = await sync([cmd('ex-1', 'CREATE_EXCHANGE'), cmd('ex-1', 'ISSUE_NEEDLE')]);

    expect(response.results[1]).toMatchObject({ status: 'REJECTED', error: { code: 'FORBIDDEN' } });
    expect(calls).toEqual(['create:ex-1']);
  });

  it('validates the payload with the HTTP route DTO', async () => {
    const { sync, calls } = build();

    const response = await sync([
      cmd('ex-1', 'CREATE_EXCHANGE', { factoryId: 'smuggled' }),
      cmd('ex-2', 'CREATE_EXCHANGE'),
      cmd('ex-2', 'SELECT_NEW_NEEDLE', { needleTypeId: 'not-a-uuid' }),
    ]);

    expect(response.results[0]).toMatchObject({
      status: 'REJECTED',
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(response.results[2].error?.details.join(' ')).toMatch(/needleTypeId/);
    expect(calls).toEqual(['create:ex-2']);
  });

  it('rejects a step for an exchange this device never created', async () => {
    const { sync } = build();

    const response = await sync([cmd('ghost', 'COMPLETE_EXCHANGE')]);

    expect(response.results[0]).toMatchObject({
      status: 'REJECTED',
      referenceId: null,
      error: { code: 'EXCHANGE_NOT_FOUND' },
    });
  });

  it('reports a server error as FAILED, retryable, and releases the key', async () => {
    const { sync, store } = build({
      fail: { 'create:ex-1': new InternalServerErrorException('db down') },
    });

    const response = await sync([cmd('ex-1', 'CREATE_EXCHANGE'), cmd('ex-1', 'ISSUE_NEEDLE')]);

    expect(response.results.map((r) => r.status)).toEqual(['FAILED', 'SKIPPED']);
    expect(store.released).toEqual([response.results[0].commandId]);
  });

  it('refuses a body naming another device', async () => {
    const { service, call } = build();

    await expect(
      service.sync({ deviceId: '33333333-3333-4333-8333-333333333333', commands: [] }, call),
    ).rejects.toMatchObject({ code: 'DEVICE_MISMATCH' });
  });

  it('refuses a malformed cursor before running any command', async () => {
    const { sync, calls } = build();

    await expect(sync([cmd('ex-1', 'CREATE_EXCHANGE')], 'garbage')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(calls).toEqual([]);
  });
});
