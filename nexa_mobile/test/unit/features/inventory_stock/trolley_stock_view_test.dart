import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_view.dart';
import 'package:nexa_mobile/features/inventory_stock/presentation/widgets/stock_status_badge.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

TrolleyStockItem item(
  String id,
  TrolleyStockStatus status, {
  int quantity = 10,
  String? name,
}) => TrolleyStockItem(
  needleTypeId: id,
  needleTypeCode: id.toUpperCase(),
  displayName: name ?? id,
  quantity: quantity,
  minimumStock: 10,
  status: status,
);

Map<String, Object?> stockItem(
  String id,
  String code,
  int quantity,
  String status,
) => {
  'needleTypeId': id,
  'needleTypeCode': code,
  'quantity': quantity,
  'minimumStock': 10,
  'stockStatus': status,
};

/// FR-MOB-015: status labels (contract matrix "Stock status labels"),
/// urgency sorting, the offline cache and its stale marking.
void main() {
  group('status mapping', () {
    test('wire NORMAL/LOW/OUT → Available/Low stock/Out of stock, in '
        'Indonesian; anything else unknown', () {
      String label(String? wire) =>
          trolleyStockStatusLabel(TrolleyStockStatus.fromWire(wire));
      expect(label('NORMAL'), AppStrings.stockStatusAvailable);
      expect(label('LOW'), AppStrings.stockStatusLow);
      expect(label('OUT'), AppStrings.stockStatusOut);
      expect(label('SOMETHING'), AppStrings.stockStatusUnknown);
      expect(label(null), AppStrings.stockStatusUnknown);
      expect(AppStrings.stockStatusAvailable, 'Tersedia');
      expect(AppStrings.stockStatusLow, 'Stok menipis');
      expect(AppStrings.stockStatusOut, 'Stok habis');
    });
  });

  group('sorting', () {
    test('out first, then low, then normal, unknown last; within a status '
        'lowest quantity first, then name', () {
      final sorted = sortTrolleyStock([
        item('n-big', TrolleyStockStatus.normal, quantity: 90),
        item('unknown', TrolleyStockStatus.unknown, quantity: 0),
        item('low-5', TrolleyStockStatus.low, quantity: 5),
        item('out-b', TrolleyStockStatus.critical, quantity: 0, name: 'B'),
        item('n-small', TrolleyStockStatus.normal, quantity: 20),
        item('low-2', TrolleyStockStatus.low, quantity: 2),
        item('out-a', TrolleyStockStatus.critical, quantity: 0, name: 'a'),
      ]);
      expect(sorted.map((i) => i.needleTypeId), [
        'out-a',
        'out-b',
        'low-2',
        'low-5',
        'n-small',
        'n-big',
        'unknown',
      ]);
    });

    test('TrolleyStockView always holds its rows sorted', () {
      final view = TrolleyStockView(
        items: [
          item('n', TrolleyStockStatus.normal),
          item('o', TrolleyStockStatus.critical),
        ],
        fetchedAt: DateTime(2026, 9, 28),
      );
      expect(view.items.first.needleTypeId, 'o');
    });
  });

  group('repository + stale cache', () {
    late FakeBackend backend;
    late AppDatabase db;
    late ProviderContainer container;
    late FakeResponse stockAnswer;

    setUp(() async {
      stockAnswer = FakeResponse.ok({
        'trolleyId': 'trolley-1',
        'factoryId': 'factory-1',
        'items': [
          stockItem('nt-1', 'DBX1-14', 40, 'NORMAL'),
          stockItem('nt-2', 'DPX5-14', 0, 'OUT'),
        ],
      });
      backend = FakeBackend()
        ..on('GET', '/inventory/trolleys/trolley-1', (_) => stockAnswer);
      db = inMemoryDatabase();
      await db
          .into(db.localNeedleType)
          .insert(
            LocalNeedleTypeCompanion.insert(
              id: 'nt-1',
              code: 'DBX1-14',
              name: 'DBx1 #14',
              unit: 'PCS',
              minimumStock: '10.000',
            ),
          );
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

    TrolleyStockRepository repo() =>
        container.read(trolleyStockRepositoryProvider);

    test('nothing cached before the first successful read', () async {
      expect(await repo().cachedTrolleyStock('trolley-1'), isNull);
    });

    test('a successful read is kept; the cached copy joins names again and '
        'carries the time it was read', () async {
      final before = DateTime.now();
      await repo().trolleyStock('trolley-1');
      final cached = await repo().cachedTrolleyStock('trolley-1');
      expect(cached, isNotNull);
      expect(cached!.items.map((i) => i.displayName), ['DBx1 #14', 'DPX5-14']);
      expect(cached.items[1].status, TrolleyStockStatus.critical);
      // Drift keeps DateTime to the second.
      expect(
        cached.fetchedAt.isBefore(before.subtract(const Duration(seconds: 1))),
        isFalse,
      );
      expect(await repo().cachedTrolleyStock('trolley-2'), isNull);
    });

    test('online: a fresh view, not stale, sorted out-first', () async {
      final outcome = await loadTrolleyStockView(
        repo(),
        'trolley-1',
        offline: false,
        now: DateTime(2026, 9, 28, 9),
      );
      final view = (outcome as TrolleyStockShown).view;
      expect(view.stale, isFalse);
      expect(view.error, isNull);
      expect(view.fetchedAt, DateTime(2026, 9, 28, 9));
      expect(view.items.first.needleTypeId, 'nt-2');
    });

    test('offline: the cached copy, marked stale with its saved time — and '
        'no request is made', () async {
      await repo().trolleyStock('trolley-1');
      final saved = (await repo().cachedTrolleyStock('trolley-1'))!.fetchedAt;
      final requests = backend.requests.length;

      final outcome = await loadTrolleyStockView(
        repo(),
        'trolley-1',
        offline: true,
        now: DateTime(2030),
      );

      final view = (outcome as TrolleyStockShown).view;
      expect(view.stale, isTrue);
      expect(view.fetchedAt, saved);
      expect(view.error, isNull);
      expect(backend.requests.length, requests);
    });

    test('online but the read fails: the cached copy, stale, with the '
        'error', () async {
      await repo().trolleyStock('trolley-1');
      stockAnswer = const FakeResponse.networkError();

      final outcome = await loadTrolleyStockView(
        repo(),
        'trolley-1',
        offline: false,
        now: DateTime(2030),
      );

      final view = (outcome as TrolleyStockShown).view;
      expect(view.stale, isTrue);
      expect(view.error?.code, 'NETWORK_TIMEOUT');
    });

    test('no fresh answer and no cache: unavailable (never a made-up '
        'number)', () async {
      stockAnswer = const FakeResponse.networkError();
      final online = await loadTrolleyStockView(
        repo(),
        'trolley-1',
        offline: false,
        now: DateTime(2030),
      );
      expect(online, isA<TrolleyStockUnavailable>());
      expect((online as TrolleyStockUnavailable).offline, isFalse);
      expect(online.error, isNotNull);

      final offline = await loadTrolleyStockView(
        repo(),
        'trolley-1',
        offline: true,
        now: DateTime(2030),
      );
      expect((offline as TrolleyStockUnavailable).offline, isTrue);
    });

    test('a newer answer replaces the cached one whole (an emptied trolley '
        'stays empty, not stale rows)', () async {
      await repo().trolleyStock('trolley-1');
      stockAnswer = FakeResponse.ok({
        'trolleyId': 'trolley-1',
        'factoryId': 'factory-1',
        'items': <Object?>[],
      });
      await repo().trolleyStock('trolley-1');
      final cached = await repo().cachedTrolleyStock('trolley-1');
      expect(cached, isNotNull);
      expect(cached!.items, isEmpty);
    });
  });
}
