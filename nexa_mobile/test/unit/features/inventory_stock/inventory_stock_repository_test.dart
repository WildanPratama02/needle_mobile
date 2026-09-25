import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

/// `GET /inventory/trolleys/{trolleyId}` (FR-MOB-015, contract matrix
/// "Trolley stock view": READY). Covers the DRIFT the matrix flags — the
/// backend returns needle **code** only and `NORMAL/LOW/OUT`, so the
/// repository must join a display name from the bootstrap cache and map
/// `OUT` to the "critical"/KRITIS UI status.
void main() {
  late FakeBackend backend;
  late AppDatabase db;
  late ProviderContainer container;

  setUp(() async {
    backend = FakeBackend();
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

  test(
    "joins the endpoint's needle code with the bootstrap display name and "
    'maps NORMAL/OUT to the UI stock status',
    () async {
      backend.on(
        'GET',
        '/inventory/trolleys/trolley-1',
        (_) => FakeResponse.ok({
          'trolleyId': 'trolley-1',
          'factoryId': 'factory-1',
          'items': [
            {
              'needleTypeId': 'nt-1',
              'needleTypeCode': 'DBX1-14',
              'quantity': 40,
              'minimumStock': 10,
              'stockStatus': 'NORMAL',
            },
            {
              'needleTypeId': 'nt-2',
              'needleTypeCode': 'DPX5-14',
              'quantity': 5,
              'minimumStock': 20,
              'stockStatus': 'OUT',
            },
          ],
        }),
      );

      final outcome = await container
          .read(trolleyStockRepositoryProvider)
          .trolleyStock('trolley-1');

      expect(outcome, isA<TrolleyStockLoaded>());
      final items = (outcome as TrolleyStockLoaded).items;
      expect(items[0].displayName, 'DBx1 #14', reason: 'joined from bootstrap');
      expect(items[0].status, TrolleyStockStatus.normal);
      expect(
        items[1].displayName,
        'DPX5-14',
        reason: 'no master-data match — falls back to the endpoint code',
      );
      expect(items[1].status, TrolleyStockStatus.critical);
    },
  );

  test('a failed call surfaces TrolleyStockFailed, never throws', () async {
    backend.on(
      'GET',
      '/inventory/trolleys/trolley-1',
      (_) => const FakeResponse.networkError(),
    );

    final outcome = await container
        .read(trolleyStockRepositoryProvider)
        .trolleyStock('trolley-1');

    expect(outcome, isA<TrolleyStockFailed>());
  });
}
