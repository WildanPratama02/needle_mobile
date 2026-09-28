import 'dart:convert';

import 'package:drift/drift.dart' show Value;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_screen.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fake_exchange_server.dart';
import '../helpers/fixtures.dart';
import '../helpers/flow_driver.dart';
import '../helpers/test_app.dart';

/// Phase 10 — transaction history (FR-MOB-014, Doc 07 §30, Doc 17 §27).

/// A `GET /exchanges` item as `exchange-response.mapper.ts` builds it.
Map<String, Object?> row(
  String id, {
  String status = 'COMPLETED',
  bool labels = true,
  String? operatorId = 'emp-1',
  String oldNeedle = 'nt-1',
  String? newNeedle = 'nt-2',
  String typeId = 'et-bent',
  String typeCode = 'BENT',
  String typeName = 'Bent Needle',
  String? confirmationId,
  String? createdAt,
}) => {
  'id': id,
  'exchangeNumber': 'EXC-$id',
  'status': status,
  'factoryId': 'factory-1',
  'trolleyId': 'trolley-1',
  'deviceId': deviceId,
  'operatorId': operatorId,
  if (labels) ...{
    'operatorEmployeeNumber': 'EMP001',
    'operatorName': 'Siti Operator',
  },
  'exchangeTypeId': typeId,
  'exchangeTypeCode': typeCode,
  'exchangeTypeName': typeName,
  'oldNeedleTypeId': oldNeedle,
  'newNeedleTypeId': newNeedle,
  'fragmentStatus': null,
  'confirmationId': confirmationId,
  'createdAt': createdAt ?? _createdToday,
  'completedAt': status == 'COMPLETED' ? (createdAt ?? _createdToday) : null,
  'cancelledAt': null,
};

/// "Today" for these tests: bootstrap reports the real time (the shared
/// fixture's fixed `serverTime` would move the server clock — and so the
/// history's Today — to that date).
final _createdToday = DateTime.now().toUtc().toIso8601String();

FakeResponse listAnswer(
  List<Map<String, Object?>> rows, {
  int page = 1,
  int totalPages = 1,
}) => FakeResponse(200, {
  'success': true,
  'data': rows,
  'meta': {
    'requestId': 'req-h',
    'page': page,
    'pageSize': historyPageSize,
    'total': rows.length * totalPages,
    'totalPages': totalPages,
  },
});

/// History list requests only (Home's count asks with `pageSize=1`).
List<RecordedRequest> historyReads(TestHarness h) => [
  for (final r in h.backend.requestsTo('GET', '/exchanges'))
    if (r.query['pageSize'] == '$historyPageSize') r,
];

Future<(TestHarness, FakeExchangeServer)> _app(
  WidgetTester tester, {
  ConnectivityStatus connectivity = ConnectivityStatus.online,
  Future<void> Function(AppDatabase db)? seed,
  FakeHandler? exchanges,
  void Function(FakeExchangeServer server)? configure,
}) async {
  final h = TestHarness.provisioned();
  final server = FakeExchangeServer(h.backend)..install();
  h.backend.on(
    'GET',
    '/mobile/bootstrap',
    (_) => FakeResponse.ok({
      ...exchangeBootstrapData(),
      'serverTime': DateTime.now().toUtc().toIso8601String(),
    }),
  );
  if (exchanges != null) h.backend.on('GET', '/exchanges', exchanges);
  configure?.call(server);
  await seedPreviousSession(h);
  if (seed != null) await tester.runAsync(() => seed(h.database));
  h.connectivity.status = connectivity;
  await h.pumpApp(tester);
  return (h, server);
}

Future<void> _openHistory(WidgetTester tester) async {
  await tapKey(tester, 'home.history');
  await waitFor(tester, find.text(AppStrings.historyScreenTitle));
  await settle(tester);
}

/// Picks [optionKey] from the dropdown [dropdownKey].
Future<void> _choose(
  WidgetTester tester,
  String dropdownKey,
  String optionKey,
) async {
  await tester.tap(
    find.descendant(
      of: find.byKey(Key(dropdownKey)),
      matching: find.byWidgetPredicate((w) => w is DropdownButton),
    ),
  );
  await settle(tester, rounds: 4);
  await tester.tap(find.byKey(Key('history.option.$optionKey')).last);
  await settle(tester);
}

Finder _inRow(String key, Finder matching) => find.descendant(
  of: find.byKey(Key('history.row.$key')),
  matching: matching,
);

final _now = DateTime(2026, 9, 28, 8);

/// This tablet's record of `exc-1` (the FakeExchangeServer exchange) with
/// its last server snapshot, the given queue, closed so Home does not
/// auto-resume it.
Future<void> _seedLocal(
  AppDatabase db, {
  required String ctx,
  String? serverId,
  Map<String, Object?>? snapshot,
  List<(String type, String status)> commands = const [],
  bool closed = true,
}) async {
  await db
      .into(db.localExchange)
      .insert(
        LocalExchangeCompanion.insert(
          clientTransactionId: ctx,
          createIdempotencyKey: 'key-$ctx',
          deviceId: deviceId,
          serverExchangeId: Value(serverId),
          exchangeNumber: Value(snapshot?['exchangeNumber'] as String?),
          lastKnownStatus: Value(snapshot?['status'] as String?),
          serverSnapshot: Value(snapshot == null ? null : jsonEncode(snapshot)),
          operatorEmployeeNumber: const Value('EMP001'),
          operatorName: const Value('Siti Operator'),
          closedAt: Value(closed ? _now : null),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
  for (final (i, (type, status)) in commands.indexed) {
    await db
        .into(db.localSyncQueue)
        .insert(
          LocalSyncQueueCompanion.insert(
            commandId: 'cmd-$ctx-$i',
            clientTransactionId: ctx,
            commandType: type,
            occurredAt: _now,
            status: status,
            lastErrorCode: Value(
              status == 'REJECTED' ? 'INVENTORY_INSUFFICIENT_STOCK' : null,
            ),
            createdAt: _now,
            updatedAt: _now,
          ),
        );
  }
}

void main() {
  testWidgets('online: every FR-MOB-014 column; Today by default, scoped to '
      'this device; each filter reaches GET /exchanges', (tester) async {
    final (h, _) = await _app(
      tester,
      exchanges: (_) => listAnswer([
        row('e1'),
        row(
          'e2',
          status: 'CANCELLED',
          labels: false,
          oldNeedle: 'nt-gone',
          newNeedle: null,
          typeId: 'et-broken',
          typeCode: 'BROKEN',
          typeName: 'Broken Needle',
          createdAt: DateTime.now()
              .subtract(const Duration(minutes: 1))
              .toUtc()
              .toIso8601String(),
        ),
      ]),
    );
    await _openHistory(tester);

    // Today, this device, UTC bounds of the local day.
    final first = historyReads(h).first.query;
    expect(first['deviceId'], deviceId);
    expect(first['page'], '1');
    expect(first['dateFrom'], endsWith('Z'));
    final from = DateTime.parse(first['dateFrom']! as String).toLocal();
    final to = DateTime.parse(first['dateTo']! as String).toLocal();
    expect((from.hour, from.minute), (0, 0));
    expect(to.difference(from).inHours, inInclusiveRange(23, 25));
    expect(first.containsKey('status'), isFalse);

    // Row e1: operator labels (MG-4), cached needle names, type, status and
    // the sync column.
    expect(_inRow('e1', find.text('Siti Operator')), findsOneWidget);
    expect(_inRow('e1', find.text('EMP001')), findsOneWidget);
    expect(_inRow('e1', find.text('DBx1 #14')), findsOneWidget);
    expect(_inRow('e1', find.text('DPx5 #14')), findsOneWidget);
    expect(_inRow('e1', find.text('Bent Needle')), findsOneWidget);
    expect(_inRow('e1', find.text(AppStrings.stateCompleted)), findsOneWidget);
    expect(
      _inRow('e1', find.byKey(const Key('sync.state.completed'))),
      findsOneWidget,
    );
    // Row e2: no MG-4 labels → degrades, a needle type no longer cached →
    // its id, no new needle yet → "—".
    expect(
      _inRow('e2', find.text(AppStrings.historyOperatorUnnamed)),
      findsOneWidget,
    );
    expect(_inRow('e2', find.text('nt-gone')), findsOneWidget);
    expect(_inRow('e2', find.text(AppStrings.stateCancelled)), findsOneWidget);
    expect(
      _inRow('e2', find.byKey(const Key('sync.state.serverAccepted'))),
      findsOneWidget,
    );

    await _choose(tester, 'history.filter.status', 'status.CANCELLED');
    expect(historyReads(h).last.query['status'], 'CANCELLED');

    await _choose(tester, 'history.filter.exchangeType', 'exchangeType.BROKEN');
    expect(historyReads(h).last.query['exchangeTypeId'], 'et-broken');

    await _choose(tester, 'history.filter.needle', 'needle.nt-2');
    expect(historyReads(h).last.query['oldNeedleTypeId'], 'nt-2');
    await tester.tap(find.text(AppStrings.historyNeedleNew));
    await settle(tester);
    final needleNew = historyReads(h).last.query;
    expect(needleNew['newNeedleTypeId'], 'nt-2');
    expect(needleNew.containsKey('oldNeedleTypeId'), isFalse);
    expect(needleNew['status'], 'CANCELLED', reason: 'filters combine');

    await tapKey(tester, 'history.filter.reset');
    final reset = historyReads(h).last.query;
    expect(
      reset.keys,
      unorderedEquals(['deviceId', 'dateFrom', 'dateTo', 'page', 'pageSize']),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('infinite scroll: the next page is read and appended', (
    tester,
  ) async {
    final (h, _) = await _app(
      tester,
      exchanges: (r) => r.query['page'] == '2'
          ? listAnswer([row('p2')], page: 2, totalPages: 2)
          : listAnswer([row('p1')], totalPages: 2),
    );
    await _openHistory(tester);
    await waitFor(tester, find.byKey(const Key('history.row.p2')));
    expect(find.byKey(const Key('history.row.p1')), findsOneWidget);
    expect(historyReads(h).map((r) => r.query['page']), ['1', '2']);
  });

  testWidgets('a queued exchange shows ONE row: server data with its "waiting '
      'to sync" badge; a never-answered one is listed as not on the server', (
    tester,
  ) async {
    final serverRow = row('exc-1', status: 'USED_NEEDLE_STORED');
    await _app(
      tester,
      exchanges: (_) => listAnswer([serverRow]),
      // The server is unreachable for sync: the step stays queued.
      configure: (server) => server
        ..clientTransactionId = 'ctid-q'
        ..exchange = serverRow
        ..interceptSync = (_) => FakeResponse.error(503, 'SERVICE_UNAVAILABLE'),
      seed: (db) async {
        await _seedLocal(
          db,
          ctx: 'ctid-q',
          serverId: 'exc-1',
          snapshot: serverRow,
          commands: [('COMPLETE_EXCHANGE', 'QUEUED')],
        );
        await _seedLocal(db, ctx: 'ctid-draft');
      },
    );
    await _openHistory(tester);
    await settle(tester);

    expect(find.byKey(const Key('history.row.exc-1')), findsOneWidget);
    expect(
      _inRow('exc-1', find.byKey(const Key('sync.state.queued'))),
      findsOneWidget,
    );
    expect(
      _inRow('exc-1', find.text(AppStrings.stateUsedNeedleStored)),
      findsOneWidget,
      reason: 'the Exchange State stays the server one — not "done"',
    );
    expect(
      _inRow('local-ctid-draft', find.text(AppStrings.historyNotOnServer)),
      findsOneWidget,
    );
    expect(
      _inRow(
        'local-ctid-draft',
        find.byKey(const Key('sync.state.localDraft')),
      ),
      findsOneWidget,
    );
  });

  testWidgets('offline: only the saved exchanges, with the offline note, and '
      'no server read', (tester) async {
    final (h, _) = await _app(
      tester,
      connectivity: ConnectivityStatus.offline,
      seed: (db) async {
        await _seedLocal(
          db,
          ctx: 'ctid-done',
          serverId: 'exc-9',
          snapshot: row('exc-9'),
        );
        await _seedLocal(
          db,
          ctx: 'ctid-q',
          serverId: 'exc-1',
          snapshot: row('exc-1', status: 'NEEDLE_ISSUED'),
          commands: [('STORE_USED_NEEDLE', 'QUEUED')],
        );
      },
    );
    await _openHistory(tester);

    expect(find.byKey(const Key('history.banner.offline')), findsOneWidget);
    expect(historyReads(h), isEmpty);
    expect(
      _inRow('exc-9', find.byKey(const Key('sync.state.completed'))),
      findsOneWidget,
    );
    expect(
      _inRow('exc-1', find.byKey(const Key('sync.state.queued'))),
      findsOneWidget,
    );
    expect(_inRow('exc-1', find.text('Siti Operator')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('server unreachable: saved data with a note and COBA LAGI', (
    tester,
  ) async {
    await _app(
      tester,
      exchanges: (r) => r.query['pageSize'] == '1'
          ? listAnswer(const [])
          : const FakeResponse.networkError(),
    );
    await _openHistory(tester);
    expect(find.byKey(const Key('history.banner.unreachable')), findsOneWidget);
    expect(find.byKey(const Key('history.retry')), findsOneWidget);
    expect(find.byKey(const Key('history.empty')), findsOneWidget);
  });

  testWidgets('detail (read-only): every field, confirmation status, evidence '
      'thumbnails; a finished exchange has no resume button', (tester) async {
    final done = row('exc-1', confirmationId: confirmationId);
    final (h, _) = await _app(
      tester,
      exchanges: (_) => listAnswer([done]),
      configure: (server) => server
        ..exchange = done
        ..confirmationStatus = 'APPROVED',
    );
    h.backend.on(
      'GET',
      '/exchanges/$exchangeId/evidence',
      (_) => FakeResponse.ok([
        {
          'id': 'ev-1',
          'exchangeId': exchangeId,
          'evidenceType': 'OLD_NEEDLE',
          'status': 'UPLOADED',
          'url': 'http://storage.test/presigned/ev-1.jpg',
          'capturedAt': '2026-09-28T01:31:00.000Z',
        },
      ]),
    );
    await _openHistory(tester);
    await tapKey(tester, 'history.row.exc-1');
    await waitFor(tester, find.text(AppStrings.historyDetailTitle));
    await settle(tester);

    expect(find.byKey(const Key('historyDetail.operator')), findsOneWidget);
    expect(find.text('Siti Operator · EMP001'), findsOneWidget);
    expect(find.text('Bent Needle'), findsOneWidget);
    expect(find.text('DBx1 #14 · DBX1-14'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byKey(const Key('historyDetail.confirmation')),
        matching: find.text(AppStrings.confirmationStatusApproved),
        matchRoot: true,
      ),
      findsOneWidget,
    );
    expect(
      find.byKey(const Key('historyDetail.evidence.ev-1')),
      findsOneWidget,
    );
    expect(find.text(AppStrings.photoOldNeedle), findsOneWidget);
    expect(find.byKey(const Key('historyDetail.resume')), findsNothing);
    expect(h.backend.requestsTo('GET', '/exchanges/$exchangeId'), isNotEmpty);
    expect(tester.takeException(), isNull);
  });

  testWidgets('detail of this tablet\'s unfinished exchange (a rejected '
      'step): resume opens it in the exchange wizard', (tester) async {
    final open = row('exc-1', status: 'NEW_NEEDLE_SELECTED', newNeedle: 'nt-2');
    await _app(
      tester,
      exchanges: (_) => listAnswer([open]),
      configure: (server) => server
        ..clientTransactionId = 'ctid-r'
        ..exchange = open,
      seed: (db) => _seedLocal(
        db,
        ctx: 'ctid-r',
        serverId: 'exc-1',
        snapshot: open,
        commands: [('ISSUE_NEEDLE', 'REJECTED')],
      ),
    );
    await _openHistory(tester);
    expect(
      _inRow('exc-1', find.byKey(const Key('sync.state.serverRejected'))),
      findsOneWidget,
    );
    await tapKey(tester, 'history.row.exc-1');
    await waitFor(tester, find.byKey(const Key('historyDetail.resume')));
    expect(find.byKey(const Key('historyDetail.rejection')), findsOneWidget);

    await tapKey(tester, 'historyDetail.resume');
    await waitFor(tester, find.byType(ExchangeFlowScreen));
    await expectStep(tester, 'issue');
  });

  testWidgets('detail offline: fields from the saved copy, photos need a '
      'connection', (tester) async {
    await _app(
      tester,
      connectivity: ConnectivityStatus.offline,
      seed: (db) => _seedLocal(
        db,
        ctx: 'ctid-done',
        serverId: 'exc-9',
        snapshot: row('exc-9'),
      ),
    );
    await _openHistory(tester);
    await tapKey(tester, 'history.row.exc-9');
    await waitFor(
      tester,
      find.byKey(const Key('historyDetail.evidence.offline')),
    );
    expect(find.text('Siti Operator · EMP001'), findsOneWidget);
  });
}
