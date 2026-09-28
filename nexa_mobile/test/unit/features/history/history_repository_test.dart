import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

/// A `GET /exchanges` item exactly as `exchange-response.mapper.ts` builds
/// it; [withOperatorLabels] `false` is a backend from before MG-4.
Map<String, Object?> exchangeRow(
  String id, {
  String status = 'COMPLETED',
  bool withOperatorLabels = true,
}) => {
  'id': id,
  'exchangeNumber': 'EXC-20260925-$id',
  'status': status,
  'factoryId': 'factory-1',
  'trolleyId': 'trolley-1',
  'deviceId': deviceId,
  'operatorId': 'emp-1',
  if (withOperatorLabels) ...{
    'operatorEmployeeNumber': 'EMP001',
    'operatorName': 'Siti Operator',
  },
  'exchangeTypeId': 'et-bent',
  'exchangeTypeCode': 'BENT',
  'exchangeTypeName': 'Bent Needle',
  'oldNeedleTypeId': 'nt-1',
  'newNeedleTypeId': 'nt-1',
  'fragmentStatus': null,
  'confirmationId': null,
  'createdAt': '2026-09-25T01:30:00.000Z',
  'completedAt': '2026-09-25T01:40:00.000Z',
  'cancelledAt': null,
};

FakeResponse page(
  List<Object?> rows, {
  int page = 1,
  int totalPages = 1,
  int? total,
}) => FakeResponse(200, {
  'success': true,
  'data': rows,
  'meta': {
    'requestId': 'req-1',
    'page': page,
    'pageSize': historyPageSize,
    'total': total ?? rows.length,
    'totalPages': totalPages,
  },
});

/// `GET /exchanges` (FR-MOB-014): the Home count and the history pages.
void main() {
  late FakeBackend backend;
  late AppDatabase db;
  late ProviderContainer container;

  setUp(() {
    backend = FakeBackend();
    db = inMemoryDatabase();
    container = ProviderContainer.test(
      overrides: [
        appConfigProvider.overrideWithValue(testConfig),
        secureStoreProvider.overrideWithValue(
          InMemorySecureStore({SecureStoreKeys.deviceId: deviceId}),
        ),
        httpClientAdapterProvider.overrideWithValue(backend),
        appDatabaseProvider.overrideWithValue(db),
      ],
    );
  });

  tearDown(() => db.close());

  HistoryRepository repo() => container.read(historyRepositoryProvider);

  test('today count: meta.total, this device, local midnight-to-midnight '
      'sent as UTC instants', () async {
    backend.on(
      'GET',
      '/exchanges',
      (request) => FakeResponse(200, {
        'success': true,
        'data': <Object?>[],
        'meta': {'requestId': 'req-1', 'total': 30},
      }),
    );

    final outcome = await repo().todayExchangeCount(
      deviceId: deviceId,
      today: DateTime(2026, 9, 25, 14, 30),
    );

    expect(outcome, isA<TodayExchangeCountLoaded>());
    expect((outcome as TodayExchangeCountLoaded).count, 30);
    final request = backend.requestsTo('GET', '/exchanges').single;
    expect(request.query['deviceId'], deviceId);
    expect(
      request.query['dateFrom'],
      DateTime(2026, 9, 25).toUtc().toIso8601String(),
    );
    expect(
      request.query['dateTo'],
      DateTime(2026, 9, 26).toUtc().toIso8601String(),
    );
    expect(request.query['pageSize'], '1');
  });

  test(
    'a failed count surfaces TodayExchangeCountFailed, never throws',
    () async {
      backend.on('GET', '/exchanges', (_) => const FakeResponse.networkError());

      final outcome = await repo().todayExchangeCount(
        deviceId: deviceId,
        today: DateTime.now(),
      );

      expect(outcome, isA<TodayExchangeCountFailed>());
    },
  );

  test('a page: every filter reaches the query, rows parse with the MG-4 '
      'operator labels, paging meta is kept', () async {
    backend.on(
      'GET',
      '/exchanges',
      (_) => page(
        [exchangeRow('e1'), exchangeRow('e2', status: 'CANCELLED')],
        page: 2,
        totalPages: 3,
        total: 55,
      ),
    );
    const filter = HistoryFilter(
      status: ExchangeState.completed,
      exchangeTypeId: 'et-bent',
      needleTypeId: 'nt-1',
      needleRole: NeedleRole.newNeedle,
    );

    final outcome = await repo().page(
      deviceId: deviceId,
      filter: filter,
      window: historyWindow(filter, DateTime(2026, 9, 25, 9)),
      page: 2,
    );

    final q = backend.requestsTo('GET', '/exchanges').single.query;
    expect(q['deviceId'], deviceId);
    expect(q['status'], 'COMPLETED');
    expect(q['exchangeTypeId'], 'et-bent');
    expect(q['newNeedleTypeId'], 'nt-1');
    expect(q.containsKey('oldNeedleTypeId'), isFalse);
    expect(q['page'], '2');
    expect(q['pageSize'], '$historyPageSize');

    final loaded = outcome as HistoryPageLoaded;
    expect(loaded.page, 2);
    expect(loaded.totalPages, 3);
    expect(loaded.total, 55);
    expect(loaded.rows, hasLength(2));
    final first = loaded.rows.first;
    expect(first.operatorEmployeeNumber, 'EMP001');
    expect(first.operatorName, 'Siti Operator');
    expect(first.createdAt, DateTime.utc(2026, 9, 25, 1, 30));
    expect(loaded.rows[1].state, ExchangeState.cancelled);
  });

  test('operator labels are optional: a backend without MG-4 still parses '
      '(labels null, operatorId kept)', () async {
    backend.on(
      'GET',
      '/exchanges',
      (_) => page([exchangeRow('e1', withOperatorLabels: false)]),
    );

    final outcome = await repo().page(
      deviceId: deviceId,
      filter: const HistoryFilter(),
      window: historyWindow(const HistoryFilter(), DateTime(2026, 9, 25)),
      page: 1,
    );

    final row = (outcome as HistoryPageLoaded).rows.single;
    expect(row.operatorId, 'emp-1');
    expect(row.operatorName, isNull);
    expect(row.operatorEmployeeNumber, isNull);
  });

  test('a row with a state this build does not know is skipped, not the '
      'whole page', () async {
    backend.on(
      'GET',
      '/exchanges',
      (_) => page([exchangeRow('e1'), exchangeRow('e2', status: 'NEW_STATE')]),
    );

    final outcome = await repo().page(
      deviceId: deviceId,
      filter: const HistoryFilter(),
      window: historyWindow(const HistoryFilter(), DateTime(2026, 9, 25)),
      page: 1,
    );

    expect((outcome as HistoryPageLoaded).rows.map((r) => r.id), ['e1']);
  });

  test('a failed page surfaces HistoryPageFailed with the error', () async {
    backend.on(
      'GET',
      '/exchanges',
      (_) => FakeResponse.error(403, 'FORBIDDEN'),
    );

    final outcome = await repo().page(
      deviceId: deviceId,
      filter: const HistoryFilter(),
      window: historyWindow(const HistoryFilter(), DateTime(2026, 9, 25)),
      page: 1,
    );

    expect((outcome as HistoryPageFailed).error.code, 'FORBIDDEN');
  });
}
