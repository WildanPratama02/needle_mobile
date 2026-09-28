import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/shared/format/date_time_format.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fake_exchange_server.dart';
import '../helpers/flow_driver.dart';
import '../helpers/test_app.dart';

/// Phase 10 — trolley stock view (FR-MOB-015, Doc 07 §31, contract matrix
/// "Trolley stock view" / "Stock status labels").

const _path = '/inventory/trolleys/trolley-1';

Map<String, Object?> _item(String id, String code, int qty, String status) => {
  'needleTypeId': id,
  'needleTypeCode': code,
  'quantity': qty,
  'minimumStock': 10,
  'stockStatus': status,
};

FakeResponse _stock(List<Map<String, Object?>> items) => FakeResponse.ok({
  'trolleyId': 'trolley-1',
  'factoryId': 'factory-1',
  'items': items,
});

final _items = [
  _item('nt-1', 'DBX1-14', 40, 'NORMAL'),
  _item('nt-3', 'UY-9', 4, 'LOW'),
  _item('nt-2', 'DPX5-14', 0, 'OUT'),
];

Future<TestHarness> _app(
  WidgetTester tester, {
  ConnectivityStatus connectivity = ConnectivityStatus.online,
  FakeHandler? stock,
  DateTime? cachedAt,
}) async {
  final h = TestHarness.provisioned();
  FakeExchangeServer(h.backend).install();
  h.backend.on('GET', _path, stock ?? (_) => _stock(_items));
  await seedPreviousSession(h);
  if (cachedAt != null) {
    await tester.runAsync(
      () => h.database
          .into(h.database.localTrolleyStock)
          .insert(
            LocalTrolleyStockCompanion.insert(
              trolleyId: 'trolley-1',
              items: jsonEncode(_items),
              fetchedAt: cachedAt,
            ),
          ),
    );
  }
  h.connectivity.status = connectivity;
  await h.pumpApp(tester);
  return h;
}

Future<void> _openStock(WidgetTester tester) async {
  await tapKey(tester, 'home.trolleyStock');
  await waitFor(tester, find.text(AppStrings.stockScreenTitle));
  await settle(tester);
}

/// Top-to-bottom order of the stock rows on screen.
List<String> _rowOrder(WidgetTester tester) {
  final rows = find.byWidgetPredicate(
    (w) =>
        w.key is ValueKey<String> &&
        (w.key! as ValueKey<String>).value.startsWith('stock.row.'),
  );
  final found = [
    for (final e in rows.evaluate())
      (
        (e.widget.key! as ValueKey<String>).value.substring(10),
        tester.getTopLeft(find.byWidget(e.widget)).dy,
      ),
  ]..sort((a, b) => a.$2.compareTo(b.$2));
  return [for (final r in found) r.$1];
}

Finder _statusOf(String id, String label) => find.descendant(
  of: find.byKey(Key('stock.status.$id')),
  matching: find.text(label),
);

void main() {
  testWidgets('online: full list from the backend — name + code, quantity, '
      'minimum, Indonesian status — out and low first; the read is kept', (
    tester,
  ) async {
    final h = await _app(tester);
    await _openStock(tester);

    expect(_rowOrder(tester), ['nt-2', 'nt-3', 'nt-1']);
    expect(find.text('DPx5 #14'), findsOneWidget);
    expect(find.text('DPX5-14'), findsOneWidget);
    expect(find.text('UY-9'), findsOneWidget, reason: 'not cached → code');
    expect(_statusOf('nt-2', AppStrings.stockStatusOut), findsOneWidget);
    expect(_statusOf('nt-3', AppStrings.stockStatusLow), findsOneWidget);
    expect(_statusOf('nt-1', AppStrings.stockStatusAvailable), findsOneWidget);
    expect(
      find.descendant(
        of: find.byKey(const Key('stock.row.nt-1')),
        matching: find.text('40'),
      ),
      findsOneWidget,
    );
    expect(find.byKey(const Key('stock.updatedAt')), findsOneWidget);
    expect(find.byKey(const Key('stock.stale')), findsNothing);
    expect(find.text(AppStrings.stockReadOnlyNote), findsOneWidget);

    final cached = await tester.runAsync(
      () => h.database.select(h.database.localTrolleyStock).getSingle(),
    );
    expect(jsonDecode(cached!.items), hasLength(3));
    expect(tester.takeException(), isNull);
  });

  testWidgets('pull-to-refresh reads the backend again', (tester) async {
    var quantity = 40;
    final h = await _app(
      tester,
      stock: (_) => _stock([_item('nt-1', 'DBX1-14', quantity, 'NORMAL')]),
    );
    await _openStock(tester);
    final before = h.backend.requestsTo('GET', _path).length;
    quantity = 12;

    await tester.fling(
      find.byKey(const Key('stock.list')),
      const Offset(0, 400),
      1000,
    );
    await settle(tester);

    expect(h.backend.requestsTo('GET', _path).length, greaterThan(before));
    expect(
      find.descendant(
        of: find.byKey(const Key('stock.row.nt-1')),
        matching: find.text('12'),
      ),
      findsOneWidget,
    );
  });

  testWidgets('offline: the last kept copy, marked stale with its saved '
      'time — no stock request', (tester) async {
    final savedAt = DateTime(2026, 9, 27, 16, 45);
    final h = await _app(
      tester,
      connectivity: ConnectivityStatus.offline,
      // Offline, any read that is still attempted (Home's card) gets no answer.
      stock: (_) => const FakeResponse.networkError(),
      cachedAt: savedAt,
    );
    final homeReads = h.backend.requestsTo('GET', _path).length;
    await _openStock(tester);

    expect(find.byKey(const Key('stock.stale')), findsOneWidget);
    expect(find.text(AppStrings.stockStaleOffline), findsOneWidget);
    expect(
      find.text('${AppStrings.stockSavedAt}: ${formatDateTime(savedAt)}'),
      findsOneWidget,
    );
    expect(_rowOrder(tester), ['nt-2', 'nt-3', 'nt-1']);
    expect(
      h.backend.requestsTo('GET', _path).length,
      homeReads,
      reason: 'the stock screen does not call the backend while offline',
    );
  });

  testWidgets('offline with nothing kept: says so, never shows a number', (
    tester,
  ) async {
    await _app(
      tester,
      connectivity: ConnectivityStatus.offline,
      stock: (_) => const FakeResponse.networkError(),
    );
    await _openStock(tester);
    expect(find.byKey(const Key('stock.unavailable')), findsOneWidget);
    expect(find.text(AppStrings.stockNoCacheOffline), findsOneWidget);
    expect(find.byKey(const Key('stock.row.nt-1')), findsNothing);
  });

  testWidgets('online but the server fails: the kept copy, stale, says the '
      'server could not be reached', (tester) async {
    await _app(
      tester,
      stock: (_) => const FakeResponse.networkError(),
      cachedAt: DateTime(2026, 9, 27, 16, 45),
    );
    await _openStock(tester);
    expect(find.byKey(const Key('stock.stale')), findsOneWidget);
    expect(find.text(AppStrings.stockStaleFailed), findsOneWidget);
    expect(find.byKey(const Key('stock.row.nt-2')), findsOneWidget);
  });

  testWidgets('Galaxy Tab A7 Lite size (1006x553 dp): stock and history lay '
      'out without overflow', (tester) async {
    tester.view.physicalSize = const Size(1006, 553);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final h = TestHarness.provisioned();
    FakeExchangeServer(h.backend).install();
    h.backend.on('GET', _path, (_) => _stock(_items));
    await seedPreviousSession(h);
    await h.pumpApp(tester, overrideView: false);

    await _openStock(tester);
    expect(tester.takeException(), isNull);
    await tapKey(tester, 'stock.back');
    await tapKey(tester, 'home.history');
    await waitFor(tester, find.text(AppStrings.historyScreenTitle));
    await settle(tester);
    expect(tester.takeException(), isNull);
  });
}
