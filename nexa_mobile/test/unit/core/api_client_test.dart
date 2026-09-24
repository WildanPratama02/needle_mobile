import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/device_access_monitor.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';

import '../../helpers/fake_backend.dart';
import '../../helpers/fakes.dart';
import '../../helpers/fixtures.dart';
import '../../helpers/test_app.dart';

void main() {
  late FakeBackend backend;
  late InMemorySecureStore store;
  late ProviderContainer container;

  ApiClient api() => container.read(apiClientProvider);

  setUp(() {
    backend = FakeBackend();
    store = InMemorySecureStore({
      SecureStoreKeys.accessToken: 'access-0',
      SecureStoreKeys.refreshToken: 'refresh-0',
      SecureStoreKeys.deviceId: deviceId,
    });
    container = ProviderContainer.test(
      overrides: [
        appConfigProvider.overrideWithValue(testConfig),
        secureStoreProvider.overrideWithValue(store),
        httpClientAdapterProvider.overrideWithValue(backend),
      ],
    );
  });

  test('authenticated call: bearer token, X-Device-ID, X-Request-ID', () async {
    backend.on('GET', '/mobile/bootstrap', (_) => FakeResponse.ok({'x': 1}));

    final result = await api().get(
      '/mobile/bootstrap',
      query: {'needleTypesVersion': 'nv1', 'ignored': null},
      decode: (d) => d,
    );

    expect(result, isA<ApiSuccess<Object?>>());
    final request = backend.requests.single;
    expect(request.header('Authorization'), 'Bearer access-0');
    expect(request.header('X-Device-ID'), deviceId);
    expect(request.header('X-Request-ID'), isNotEmpty);
    expect(request.header('Idempotency-Key'), isNull);
    expect(request.query, {'needleTypesVersion': 'nv1'});
  });

  test('public call: no bearer token, still X-Device-ID', () async {
    backend.on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()));

    await api().post(
      '/auth/login',
      body: {'username': 'u', 'password': 'p'},
      authenticated: false,
      decode: (d) => d,
    );

    final request = backend.requests.single;
    expect(request.header('Authorization'), isNull);
    expect(request.header('X-Device-ID'), deviceId);
  });

  test('no X-Device-ID before provisioning', () async {
    store.values.remove(SecureStoreKeys.deviceId);
    backend.on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()));

    await api().post('/auth/login', authenticated: false, decode: (d) => d);

    expect(backend.requests.single.header('X-Device-ID'), isNull);
  });

  test('Idempotency-Key is sent when given (Docs/12 §25)', () async {
    backend.on('POST', '/exchanges', (_) => FakeResponse.ok({}, status: 201));

    await api().post(
      '/exchanges',
      body: {},
      idempotencyKey: 'key-1',
      decode: (d) => d,
    );

    expect(backend.requests.single.header('Idempotency-Key'), 'key-1');
  });

  test('204 is a success without a body', () async {
    backend.on('POST', '/auth/logout', (_) => const FakeResponse(204));

    final result = await api().post<void>(
      '/auth/logout',
      authenticated: false,
      decode: (_) {},
    );

    expect(result, isA<ApiSuccess<void>>());
  });

  test(
    'a body that does not decode is MALFORMED_RESPONSE, not a crash',
    () async {
      backend.on('GET', '/auth/me', (_) => FakeResponse.ok({'id': 42}));

      final result = await api().get(
        '/auth/me',
        decode: (d) => (d! as Map<String, Object?>)['id']! as String,
      );

      expect(
        (result as ApiFailure<String>).error.code,
        ClientErrorCodes.malformedResponse,
      );
    },
  );

  test(
    'DEVICE_INACTIVE on any call is broadcast to the device monitor',
    () async {
      backend.on(
        'POST',
        '/devices/$deviceId/heartbeat',
        (_) => FakeResponse.error(
          403,
          'DEVICE_INACTIVE',
          context: {'status': 'REVOKED'},
        ),
      );
      final events = <DeviceAccessEvent>[];
      final sub = container
          .read(deviceAccessMonitorProvider)
          .events
          .listen(events.add);
      addTearDown(sub.cancel);

      final result = await api().post(
        '/devices/$deviceId/heartbeat',
        body: {'appVersion': '1.0.0'},
        decode: (d) => d,
      );
      await Future<void>.delayed(Duration.zero);

      expect((result as ApiFailure<Object?>).error.code, 'DEVICE_INACTIVE');
      expect(events.single, isA<DeviceAccessInactive>());
      expect((events.single as DeviceAccessInactive).status, 'REVOKED');
    },
  );

  test('no response → NETWORK_TIMEOUT', () async {
    backend.on('GET', '/auth/me', (_) => const FakeResponse.networkError());

    final result = await api().get('/auth/me', decode: (d) => d);

    expect(
      (result as ApiFailure<Object?>).error.code,
      ClientErrorCodes.networkTimeout,
    );
  });
}
