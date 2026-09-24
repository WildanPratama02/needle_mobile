import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/auth/data/auth_providers.dart';
import 'package:nexa_mobile/features/auth/domain/auth_repository.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

void main() {
  late FakeBackend backend;
  late InMemorySecureStore store;
  late AppDatabase db;
  late ProviderContainer container;

  AuthRepository repo() => container.read(authRepositoryProvider);

  setUp(() {
    backend = FakeBackend();
    store = InMemorySecureStore({SecureStoreKeys.deviceId: deviceId});
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

  test('login stores the token pair and the user; sends X-Device-ID', () async {
    backend.on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()));

    final result = await repo().login(username: 'pic01', password: 'secret');

    expect(result, isA<LoginSucceeded>());
    expect((result as LoginSucceeded).user.name, 'Budi Santoso');
    expect(store.values[SecureStoreKeys.accessToken], 'access-1');
    expect(store.values[SecureStoreKeys.refreshToken], 'refresh-1');
    final request = backend.requests.single;
    expect(request.body, {'username': 'pic01', 'password': 'secret'});
    expect(request.header('X-Device-ID'), deviceId);
    expect(request.header('Authorization'), isNull);
    expect((await repo().restoreSession())?.id, 'user-1');
  });

  test(
    'wrong credentials: 401 is an authentication error, nothing stored',
    () async {
      backend.on(
        'POST',
        '/auth/login',
        (_) => FakeResponse.error(401, 'UNAUTHORIZED'),
      );

      final result = await repo().login(username: 'pic01', password: 'bad');

      expect(result, isA<LoginFailed>());
      expect(
        (result as LoginFailed).error.category,
        ErrorCategory.authentication,
      );
      expect(store.values.containsKey(SecureStoreKeys.accessToken), isFalse);
      // A failed login must not trigger a token refresh.
      expect(backend.requestsTo('POST', '/auth/refresh'), isEmpty);
    },
  );

  test('refreshProfile stores permissions and scopes from /auth/me', () async {
    backend.on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()));
    backend.on(
      'GET',
      '/auth/me',
      (_) => FakeResponse.ok(
        meData(permissions: ['MOBILE_OPERATE', 'DEVICE_MANAGE']),
      ),
    );
    await repo().login(username: 'pic01', password: 'secret');

    final user = await repo().refreshProfile();

    expect(user?.profileLoaded, isTrue);
    expect(user?.canReprovisionDevice, isTrue);
    expect(user?.factoryIds, ['factory-1']);
    expect(
      backend.requestsTo('GET', '/auth/me').single.header('Authorization'),
      'Bearer access-1',
    );
    expect(
      (await repo().restoreSession())?.permissions,
      contains('DEVICE_MANAGE'),
    );
  });

  test('logout revokes the refresh token and clears the session', () async {
    backend.on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()));
    backend.on('POST', '/auth/logout', (_) => const FakeResponse(204));
    await repo().login(username: 'pic01', password: 'secret');

    await repo().logout();

    expect(backend.requestsTo('POST', '/auth/logout').single.body, {
      'refreshToken': 'refresh-1',
    });
    expect(store.values.containsKey(SecureStoreKeys.refreshToken), isFalse);
    expect(await repo().restoreSession(), isNull);
    expect(
      store.values[SecureStoreKeys.deviceId],
      deviceId,
      reason: 'logout keeps the device provisioned',
    );
  });

  test('logout offline still signs out locally', () async {
    backend.on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()));
    backend.on(
      'POST',
      '/auth/logout',
      (_) => const FakeResponse.networkError(),
    );
    await repo().login(username: 'pic01', password: 'secret');

    await repo().logout();

    expect(await repo().restoreSession(), isNull);
  });
}
