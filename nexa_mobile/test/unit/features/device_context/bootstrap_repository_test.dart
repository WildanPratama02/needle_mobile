import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

void main() {
  late FakeBackend backend;
  late InMemorySecureStore store;
  late AppDatabase db;
  late ProviderContainer container;

  BootstrapRepository repo() => container.read(bootstrapRepositoryProvider);

  setUp(() {
    backend = FakeBackend();
    store = InMemorySecureStore({
      SecureStoreKeys.accessToken: 'access-0',
      SecureStoreKeys.refreshToken: 'refresh-0',
      SecureStoreKeys.deviceId: deviceId,
    });
    db = inMemoryDatabase();
    container = ProviderContainer.test(
      overrides: [
        appConfigProvider.overrideWithValue(testConfig),
        secureStoreProvider.overrideWithValue(store),
        httpClientAdapterProvider.overrideWithValue(backend),
        appDatabaseProvider.overrideWithValue(db),
      ],
    );
  });

  tearDown(() => db.close());

  test('success: persists context, status and master data', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.ok(bootstrapData()),
    );

    final outcome = await repo().bootstrap();

    expect(outcome, isA<BootstrapSucceeded>());
    final context = (outcome as BootstrapSucceeded).context;
    expect(context.factory.name, 'Factory A');
    expect(context.trolley.code, 'TROL-A-01');
    expect(context.syncCursor, 'cursor-1');

    final cached = await repo().cached();
    expect(cached.context?.device.id, deviceId);
    expect(cached.context?.device.status, DeviceStatus.active);
    expect(cached.lastKnownStatus, DeviceStatus.active);

    final master = container.read(masterDataRepositoryProvider);
    expect(await master.needleTypes(), hasLength(1));
    expect(await master.exchangeTypes(), hasLength(1));
    expect(await master.storageMappings(), hasLength(1));
    final versions = await master.storedVersions();
    expect(versions.of(MasterDataCollection.needleTypes), 'nv1');
  });

  test(
    'sends the stored versions back; null collections keep the cache',
    () async {
      backend.on(
        'GET',
        '/mobile/bootstrap',
        (_) => FakeResponse.ok(bootstrapData()),
      );
      await repo().bootstrap();

      backend.on(
        'GET',
        '/mobile/bootstrap',
        (_) => FakeResponse.ok(bootstrapData(includeCollections: false)),
      );
      await repo().bootstrap();

      final second = backend.requestsTo('GET', '/mobile/bootstrap').last;
      expect(second.query, {
        'needleTypesVersion': 'nv1',
        'exchangeTypesVersion': 'ev1',
        'storageMappingsVersion': 'sv1',
      });
      expect(second.header('X-Device-ID'), deviceId);
      final master = container.read(masterDataRepositoryProvider);
      expect(await master.needleTypes(), hasLength(1), reason: 'cache kept');
    },
  );

  test('first bootstrap sends no version parameters', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.ok(bootstrapData()),
    );

    await repo().bootstrap();

    expect(backend.requests.single.query, isEmpty);
  });

  test('403 DEVICE_INACTIVE (REVOKED) → blocked, and remembered', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.error(
        403,
        'DEVICE_INACTIVE',
        context: {'status': 'REVOKED'},
      ),
    );

    final outcome = await repo().bootstrap();

    expect(outcome, isA<BootstrapDeviceBlocked>());
    expect((outcome as BootstrapDeviceBlocked).status, DeviceStatus.revoked);
    expect((await repo().cached()).lastKnownStatus, DeviceStatus.revoked);
  });

  test('404 DEVICE_NOT_FOUND → not registered', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.error(404, 'DEVICE_NOT_FOUND'),
    );

    expect(await repo().bootstrap(), isA<BootstrapDeviceNotRegistered>());
  });

  test(
    '403 FORBIDDEN (no MOBILE_OPERATE / out of scope) → access denied',
    () async {
      backend.on(
        'GET',
        '/mobile/bootstrap',
        (_) => FakeResponse.error(403, 'FORBIDDEN'),
      );

      expect(await repo().bootstrap(), isA<BootstrapAccessDenied>());
    },
  );

  test('offline → unavailable, cache untouched', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.ok(bootstrapData()),
    );
    await repo().bootstrap();
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => const FakeResponse.networkError(),
    );

    final outcome = await repo().bootstrap();

    expect(outcome, isA<BootstrapUnavailable>());
    expect(
      (outcome as BootstrapUnavailable).error.code,
      ClientErrorCodes.networkTimeout,
    );
    expect((await repo().cached()).context?.factory.name, 'Factory A');
  });

  test('cache of another device id is not used', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.ok(bootstrapData()),
    );
    await repo().bootstrap();

    await container.read(provisionedDeviceStoreProvider).clear();
    store.values[SecureStoreKeys.deviceId] =
        '00000000-0000-4000-8000-000000000000';
    final fresh = ProviderContainer.test(
      overrides: [
        appConfigProvider.overrideWithValue(testConfig),
        secureStoreProvider.overrideWithValue(store),
        httpClientAdapterProvider.overrideWithValue(backend),
        appDatabaseProvider.overrideWithValue(db),
      ],
    );

    final cached = await fresh.read(bootstrapRepositoryProvider).cached();
    expect(cached.context, isNull);
    expect(cached.lastKnownStatus, isNull);
  });

  test('bootstrap learns the device code after manual entry', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.ok(bootstrapData()),
    );

    await repo().bootstrap();

    expect(store.values[SecureStoreKeys.deviceCode], deviceCode);
  });

  test('re-provisioning clears every device-bound cache', () async {
    backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.ok(bootstrapData()),
    );
    await repo().bootstrap();

    await container.read(provisioningRepositoryProvider).clear();

    expect(store.values.containsKey(SecureStoreKeys.deviceId), isFalse);
    final master = container.read(masterDataRepositoryProvider);
    expect(await master.needleTypes(), isEmpty);
    expect((await master.storedVersions()).isEmpty, isTrue);
    expect(await db.select(db.localDeviceContext).get(), isEmpty);
  });
}
