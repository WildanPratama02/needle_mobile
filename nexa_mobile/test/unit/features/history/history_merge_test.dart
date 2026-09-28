import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/features/history/domain/history_merge.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';

import '../../../helpers/fixtures.dart';

final _today = DateTime(2026, 9, 25, 12);
final _window = historyWindow(const HistoryFilter(), _today);

ExchangeSnapshot server(
  String id, {
  ExchangeState state = ExchangeState.completed,
  String device = deviceId,
  DateTime? createdAt,
  String? operatorId,
  String? operatorName,
  String? operatorNumber,
  String? oldNeedle,
  String? exchangeTypeId,
}) => ExchangeSnapshot(
  id: id,
  exchangeNumber: 'EXC-$id',
  state: state,
  factoryId: 'factory-1',
  trolleyId: 'trolley-1',
  deviceId: device,
  operatorId: operatorId,
  operatorName: operatorName,
  operatorEmployeeNumber: operatorNumber,
  oldNeedleTypeId: oldNeedle,
  exchangeTypeId: exchangeTypeId,
  createdAt: createdAt ?? _today,
);

SyncCommand queued(String ctx, {SyncCommandStatus? status}) => SyncCommand(
  sequence: 1,
  commandId: 'cmd-$ctx',
  clientTransactionId: ctx,
  type: SyncCommandType.issueNeedle,
  payload: const {},
  occurredAt: _today,
  status: status ?? SyncCommandStatus.queued,
  createdAt: _today,
  lastError: status == SyncCommandStatus.rejected
      ? const SyncCommandError(code: 'INVENTORY_INSUFFICIENT_STOCK')
      : null,
);

ExchangeSyncView local(
  String ctx, {
  String? serverId,
  ExchangeSnapshot? snapshot,
  List<SyncCommand> commands = const [],
  String device = deviceId,
  DateTime? createdAt,
  bool closed = false,
  String? operatorName,
  String? operatorNumber,
}) => ExchangeSyncView(
  clientTransactionId: ctx,
  createdAt: createdAt ?? _today,
  deviceId: device,
  serverExchangeId: serverId ?? snapshot?.id,
  snapshot: snapshot,
  serverState: snapshot?.state,
  hasServerRecord: (serverId ?? snapshot?.id) != null,
  exchangeNumber: snapshot?.exchangeNumber,
  commands: commands,
  closed: closed,
  operatorName: operatorName,
  operatorEmployeeNumber: operatorNumber,
);

List<HistoryEntry> merge({
  List<ExchangeSnapshot> rows = const [],
  List<ExchangeSyncView> locals = const [],
  bool serverAvailable = true,
  HistoryFilter filter = const HistoryFilter(),
  bool syncing = false,
}) => mergeHistory(
  serverRows: rows,
  localViews: locals,
  deviceId: deviceId,
  filter: filter,
  window: historyWindow(filter, _today),
  serverAvailable: serverAvailable,
  syncing: syncing,
);

void main() {
  test('server-only rows: status from the server, sync state from the '
      'mapper (COMPLETED → completed, anything else → accepted)', () {
    final entries = merge(
      rows: [
        server('a', createdAt: _today.add(const Duration(minutes: 2))),
        server('b', state: ExchangeState.cancelled),
      ],
    );
    expect(entries.map((e) => e.key), ['a', 'b']);
    expect(entries[0].state, ExchangeState.completed);
    expect(entries[0].syncState, LocalSyncState.completed);
    expect(entries[1].syncState, LocalSyncState.serverAccepted);
    expect(entries[0].local, isNull);
  });

  test('local-only (POST /exchanges never answered) appears online with its '
      'badge and no invented server status', () {
    final entries = merge(
      locals: [
        local('ctx-1'),
        local('ctx-2', commands: [queued('ctx-2')]),
      ],
    );
    expect(entries, hasLength(2));
    final draft = entries.firstWhere((e) => e.clientTransactionId == 'ctx-1');
    expect(draft.state, isNull, reason: 'the server does not know it');
    expect(draft.syncState, LocalSyncState.localDraft);
    expect(draft.key, 'local-ctx-1');
    final waiting = entries.firstWhere((e) => e.clientTransactionId == 'ctx-2');
    expect(waiting.syncState, LocalSyncState.queued);
  });

  test('queued-over-server: the server row and its local record are ONE row; '
      'Exchange State from the server, the queued badge layered on top', () {
    final row = server('e1', state: ExchangeState.newNeedleSelected);
    final entries = merge(
      rows: [row],
      locals: [
        local(
          'ctx-1',
          snapshot: server('e1', state: ExchangeState.evidenceCaptured),
          commands: [queued('ctx-1')],
        ),
      ],
    );
    expect(entries, hasLength(1));
    expect(entries.single.key, 'e1');
    expect(entries.single.clientTransactionId, 'ctx-1');
    expect(entries.single.state, ExchangeState.newNeedleSelected);
    expect(entries.single.syncState, LocalSyncState.queued);
    expect(entries.single.pendingSteps, 1);
  });

  test('a sync in flight shows "syncing"; a rejected step "rejected"', () {
    expect(
      merge(
        rows: [server('e1', state: ExchangeState.newNeedleSelected)],
        locals: [
          local('c', serverId: 'e1', commands: [queued('c')]),
        ],
        syncing: true,
      ).single.syncState,
      LocalSyncState.syncing,
    );
    expect(
      merge(
        rows: [server('e1', state: ExchangeState.newNeedleSelected)],
        locals: [
          local(
            'c',
            serverId: 'e1',
            commands: [queued('c', status: SyncCommandStatus.rejected)],
          ),
        ],
      ).single.syncState,
      LocalSyncState.serverRejected,
    );
  });

  test('the fresher server answer wins: a kept COMPLETED snapshot beats an '
      'older history page saying NEEDLE_ISSUED (states never go back)', () {
    final entries = merge(
      rows: [server('e1', state: ExchangeState.needleIssued)],
      locals: [local('c', snapshot: server('e1'))],
    );
    expect(entries.single.state, ExchangeState.completed);
    expect(entries.single.syncState, LocalSyncState.completed);
  });

  test('dedupe: a row repeated across pages and a matched local record give '
      'one row', () {
    final entries = merge(
      rows: [server('e1'), server('e2'), server('e1')],
      locals: [local('c1', snapshot: server('e1'))],
    );
    expect(entries.map((e) => e.key), unorderedEquals(['e1', 'e2']));
  });

  test('online: a fully synced local exchange the server page did not return '
      'is NOT added (the server list is the truth); offline it is', () {
    final synced = local('c1', snapshot: server('e9'));
    expect(merge(locals: [synced]), isEmpty);
    final offline = merge(locals: [synced], serverAvailable: false);
    expect(offline.single.key, 'e9');
    expect(offline.single.state, ExchangeState.completed);
  });

  test('an unsynced local exchange with a server id is shown online even '
      'before its page loads, and not duplicated once it does', () {
    final pending = local(
      'c1',
      snapshot: server('e5', state: ExchangeState.needleIssued),
      commands: [queued('c1')],
    );
    expect(merge(locals: [pending]).single.key, 'e5');
    expect(
      merge(
        rows: [server('e5', state: ExchangeState.needleIssued)],
        locals: [pending],
      ),
      hasLength(1),
    );
  });

  test("other devices' exchanges never show (server or local)", () {
    final entries = merge(
      rows: [server('x', device: 'other-device')],
      locals: [local('c', device: 'other-device')],
      serverAvailable: false,
    );
    expect(entries, isEmpty);
  });

  test('local rows obey the filter and the date window', () {
    final yesterday = _today.subtract(const Duration(days: 1));
    final locals = [
      local('old', createdAt: yesterday, commands: [queued('old')]),
      local(
        'bent',
        snapshot: server(
          'e1',
          state: ExchangeState.evidenceCaptured,
          exchangeTypeId: 'et-bent',
          oldNeedle: 'nt-1',
        ),
        commands: [queued('bent')],
      ),
      local('draft'),
    ];
    expect(
      merge(locals: locals).map((e) => e.clientTransactionId),
      unorderedEquals(['bent', 'draft']),
      reason: "yesterday's is outside Today",
    );
    expect(
      merge(
        locals: locals,
        filter: const HistoryFilter(status: ExchangeState.evidenceCaptured),
      ).map((e) => e.clientTransactionId),
      ['bent'],
      reason: 'an unknown state never matches a status filter',
    );
    expect(
      merge(
        locals: locals,
        filter: const HistoryFilter(exchangeTypeId: 'et-broken'),
      ),
      isEmpty,
    );
    expect(
      merge(
        locals: locals,
        filter: const HistoryFilter(needleTypeId: 'nt-1'),
      ).single.clientTransactionId,
      'bent',
    );
    expect(
      merge(
        locals: locals,
        filter: const HistoryFilter(
          needleTypeId: 'nt-1',
          needleRole: NeedleRole.newNeedle,
        ),
      ),
      isEmpty,
    );
  });

  test('newest first, by server createdAt else local start time', () {
    final entries = merge(
      rows: [
        server('mid', createdAt: _today.add(const Duration(hours: 1))),
        server('early', createdAt: _today),
      ],
      locals: [local('late', createdAt: _today.add(const Duration(hours: 2)))],
    );
    expect(entries.map((e) => e.key), ['local-late', 'mid', 'early']);
  });

  group('operator labels (MG-4 optional)', () {
    test('the server labels when sent', () {
      final e = merge(
        rows: [
          server(
            'e1',
            operatorId: 'emp-1',
            operatorName: 'Siti',
            operatorNumber: 'EMP001',
          ),
        ],
      ).single;
      expect(e.operatorName, 'Siti');
      expect(e.operatorEmployeeNumber, 'EMP001');
    });

    test('a backend without MG-4: falls back to what the tablet kept from '
        'the RFID lookup', () {
      final e = merge(
        rows: [server('e1', operatorId: 'emp-1')],
        locals: [
          local(
            'c',
            snapshot: server('e1', operatorId: 'emp-1'),
            operatorName: 'Siti',
            operatorNumber: 'EMP001',
          ),
        ],
      ).single;
      expect(e.operatorName, 'Siti');
      expect(e.operatorEmployeeNumber, 'EMP001');
    });

    test('no labels anywhere: an assigned operator is still known to exist; '
        'none assigned is none', () {
      final rows = merge(
        rows: [
          server('a', operatorId: 'emp-1'),
          server('b', state: ExchangeState.created),
        ],
      );
      final a = rows.firstWhere((e) => e.key == 'a');
      final b = rows.firstWhere((e) => e.key == 'b');
      expect(a.operatorName, isNull);
      expect(a.hasOperator, isTrue);
      expect(b.hasOperator, isFalse);
    });
  });

  group('canResume', () {
    test('only this tablet\'s unfinished, not handed-over exchange', () {
      HistoryEntry entryOf(ExchangeSyncView v) => HistoryEntry.of(local: v);
      final open = local(
        'c',
        snapshot: server('e1', state: ExchangeState.evidenceCaptured),
      );
      expect(entryOf(open).canResume(deviceId), isTrue);
      expect(entryOf(open).canResume('another-device'), isFalse);
      expect(
        entryOf(local('c', snapshot: server('e1'))).canResume(deviceId),
        isFalse,
        reason: 'COMPLETED on the server',
      );
      expect(
        entryOf(
          local(
            'c',
            snapshot: server('e1', state: ExchangeState.usedNeedleStored),
            closed: true,
            commands: [queued('c')],
          ),
        ).canResume(deviceId),
        isFalse,
        reason: 'complete queued — the PIC is done with it',
      );
      expect(
        entryOf(
          local(
            'c',
            snapshot: server('e1', state: ExchangeState.newNeedleSelected),
            closed: true,
            commands: [queued('c', status: SyncCommandStatus.rejected)],
          ),
        ).canResume(deviceId),
        isTrue,
        reason: 'a rejection brought it back to the PIC',
      );
      expect(entryOf(local('draft')).canResume(deviceId), isTrue);
      expect(
        HistoryEntry.of(
          serverRow: server('e1', state: ExchangeState.evidenceCaptured),
        ).canResume(deviceId),
        isFalse,
        reason: 'no local record — the wizard cannot resume it',
      );
    });
  });

  test('forServerOnly is the mapper, not a second mapping', () {
    expect(
      SyncStateMapper.forServerOnly(ExchangeState.completed),
      LocalSyncState.completed,
    );
    expect(
      SyncStateMapper.forServerOnly(ExchangeState.created),
      LocalSyncState.serverAccepted,
    );
    expect(_window.contains(_today), isTrue);
  });
}
