import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

/// `GET /exchanges` (FR-MOB-014) scoped to one device and one day — only
/// `meta.total` is used, for the Home "Riwayat" card's count.
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

  test(
    'reads the count from meta.total, filtered to this device and today '
    '(midnight-to-midnight)',
    () async {
      backend.on(
        'GET',
        '/exchanges',
        (request) => FakeResponse(200, {
          'success': true,
          'data': <Object?>[],
          'meta': {'requestId': 'req-1', 'total': 30},
        }),
      );

      final outcome = await container
          .read(historyRepositoryProvider)
          .todayExchangeCount(
            deviceId: deviceId,
            today: DateTime.utc(2026, 9, 25, 14, 30),
          );

      expect(outcome, isA<TodayExchangeCountLoaded>());
      expect((outcome as TodayExchangeCountLoaded).count, 30);
      final request = backend.requestsTo('GET', '/exchanges').single;
      expect(request.query['deviceId'], deviceId);
      expect(request.query['dateFrom'], '2026-09-25T00:00:00.000');
      expect(request.query['dateTo'], '2026-09-26T00:00:00.000');
      expect(request.query['pageSize'], '1');
    },
  );

  test('a failed call surfaces TodayExchangeCountFailed, never throws', () async {
    backend.on(
      'GET',
      '/exchanges',
      (_) => const FakeResponse.networkError(),
    );

    final outcome = await container
        .read(historyRepositoryProvider)
        .todayExchangeCount(deviceId: deviceId, today: DateTime.now());

    expect(outcome, isA<TodayExchangeCountFailed>());
  });
}
