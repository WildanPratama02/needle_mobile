import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/app/app.dart';
import 'package:nexa_mobile/core/app_info/app_info.dart';
import 'package:nexa_mobile/core/config/app_config.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/auth/data/user_session_local_data_source.dart';
import 'package:nexa_mobile/features/auth/domain/auth_user.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_local_data_source.dart';
import 'package:nexa_mobile/features/device_context/data/mobile_scanner_qr_scanner.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';

import 'fake_backend.dart';
import 'fakes.dart';
import 'fixtures.dart';

final testConfig = AppConfig.parse(
  env: 'dev',
  apiBaseUrl: 'http://backend.test:3100/api/v1',
);

AppDatabase inMemoryDatabase() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  return AppDatabase(NativeDatabase.memory());
}

/// Everything a full-app widget test needs: the real app wiring with the
/// hardware and the backend replaced.
class TestHarness {
  TestHarness({
    Map<String, String>? secureValues,
    ConnectivityStatus connectivity = ConnectivityStatus.online,
  }) : secureStore = InMemorySecureStore(secureValues),
       connectivity = FakeConnectivitySource(connectivity);

  /// A tablet that has already been provisioned with [deviceId].
  factory TestHarness.provisioned({bool withCode = true}) => TestHarness(
    secureValues: {
      SecureStoreKeys.deviceId: deviceId,
      if (withCode) SecureStoreKeys.deviceCode: deviceCode,
    },
  );

  final InMemorySecureStore secureStore;
  final FakeConnectivitySource connectivity;
  final FakeBackend backend = FakeBackend();
  final FakeQrScanner scanner = FakeQrScanner();
  final AppDatabase database = inMemoryDatabase();

  List<Override> get overrides => [
    appConfigProvider.overrideWithValue(testConfig),
    secureStoreProvider.overrideWithValue(secureStore),
    appDatabaseProvider.overrideWithValue(database),
    httpClientAdapterProvider.overrideWithValue(backend),
    connectivitySourceProvider.overrideWithValue(connectivity),
    appVersionProvider.overrideWith((ref) async => '1.0.0+1'),
    qrScannerProvider.overrideWith((ref) => scanner),
    qrScannerPreviewBuilderProvider.overrideWithValue(fakePreview),
  ];

  /// Pumps the whole app on a landscape tablet surface (Doc 17 §3).
  ///
  /// [overrideView] forces a synthetic 1280x800@1.0 view, which is what
  /// every `flutter test` widget test wants (deterministic, independent of
  /// the host machine). Pass `false` under `integration_test` on a real
  /// device to keep that device's actual reported physical size/density —
  /// needed to reproduce a layout bug (like a `RenderFlex` overflow) that
  /// only shows up at a specific device's real constraints, not the
  /// synthetic default (Doc 07 §58).
  Future<void> pumpApp(WidgetTester tester, {bool overrideView = true}) async {
    if (overrideView) {
      tester.view.physicalSize = const Size(1280, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
    }
    addTearDown(database.close);
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides,
        retry: (_, _) => null,
        child: const NexaApp(),
      ),
    );
    await settle(tester);
  }
}

/// Lets async storage, the fake backend and the router catch up. Avoids
/// `pumpAndSettle`, which never settles while a spinner animates.
Future<void> settle(WidgetTester tester, {int rounds = 12}) async {
  for (var i = 0; i < rounds; i++) {
    await tester.runAsync(() => Future<void>.delayed(Duration.zero));
    await tester.pump(const Duration(milliseconds: 50));
  }
}

/// A tablet that was used before: tokens, cached user, cached ACTIVE context.
Future<void> seedPreviousSession(TestHarness h) async {
  h.secureStore.values.addAll({
    SecureStoreKeys.accessToken: 'access-1',
    SecureStoreKeys.refreshToken: 'refresh-1',
  });
  await UserSessionLocalDataSource(h.database).write(
    const AuthUser(
      id: 'user-1',
      username: 'pic01',
      name: 'Budi Santoso',
      roles: ['PIC_TROLI'],
    ),
  );
  final local = DeviceContextLocalDataSource(h.database);
  await local.writeContext(
    DeviceContextSnapshot(
      device: const DeviceInfo(
        id: deviceId,
        code: deviceCode,
        name: 'Tablet A-01',
        status: DeviceStatus.active,
      ),
      factory: const FactoryInfo(
        id: 'factory-1',
        code: 'FAC-A',
        name: 'Factory A',
        timezone: 'Asia/Jakarta',
      ),
      trolley: const TrolleyInfo(
        id: 'trolley-1',
        code: 'TROL-A-01',
        name: 'Trolley A-01',
        locationId: 'location-1',
      ),
      serverTime: DateTime.utc(2026, 9, 24, 8),
      syncCursor: 'cursor-1',
      fetchedAt: DateTime(2026, 9, 24, 7, 30),
    ),
  );
  await local.writeStatus(deviceId, DeviceStatus.active);
}
