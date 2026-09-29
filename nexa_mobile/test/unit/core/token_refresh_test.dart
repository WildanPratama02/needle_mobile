import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/network/session_events.dart';
import 'package:nexa_mobile/core/network/token_refresher.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';

import '../../helpers/fake_backend.dart';
import '../../helpers/fakes.dart';
import '../../helpers/fixtures.dart';
import '../../helpers/test_app.dart';

/// Refresh tokens are single-use and rotating; a replay revokes the whole
/// family (contract matrix "Auth"). These tests pin the client side of that.
void main() {
  late FakeBackend backend;
  late InMemorySecureStore store;
  late ProviderContainer container;
  late int refreshCalls;
  late Map<String, String> validAccess; // access token → accepted

  ApiClient api() => container.read(apiClientProvider);

  Future<ApiResult<String>> protectedCall() =>
      api().get('/protected', decode: (d) => d! as String);

  setUp(() {
    backend = FakeBackend();
    store = InMemorySecureStore({
      SecureStoreKeys.accessToken: 'access-0',
      SecureStoreKeys.refreshToken: 'refresh-0',
      SecureStoreKeys.deviceId: deviceId,
    });
    refreshCalls = 0;
    validAccess = {};
    container = ProviderContainer.test(
      overrides: [
        appConfigProvider.overrideWithValue(testConfig),
        secureStoreProvider.overrideWithValue(store),
        httpClientAdapterProvider.overrideWithValue(backend),
      ],
    );

    backend.on('GET', '/protected', (r) {
      final token = r.header('Authorization')?.replaceFirst('Bearer ', '');
      return validAccess.containsKey(token)
          ? FakeResponse.ok('ok with $token')
          : FakeResponse.error(401, 'UNAUTHORIZED');
    });
  });

  /// Rotates refresh-N → access-(N+1)/refresh-(N+1); a replayed refresh
  /// token is refused like the backend does.
  void rotatingRefresh({Completer<void>? gate}) {
    final used = <String>{};
    backend.on('POST', '/auth/refresh', (r) async {
      refreshCalls++;
      await gate?.future;
      final sent = (r.body! as Map<String, Object?>)['refreshToken']! as String;
      if (!used.add(sent)) return FakeResponse.error(401, 'UNAUTHORIZED');
      final n = int.parse(sent.split('-').last) + 1;
      validAccess['access-$n'] = 'yes';
      return FakeResponse.ok({
        'accessToken': 'access-$n',
        'refreshToken': 'refresh-$n',
        'expiresIn': 900,
      });
    });
  }

  test(
    'concurrent 401s share ONE refresh call, then each resends once',
    () async {
      final gate = Completer<void>();
      rotatingRefresh(gate: gate);

      final calls = [protectedCall(), protectedCall(), protectedCall()];
      await Future<void>.delayed(const Duration(milliseconds: 20));
      gate.complete();
      final results = await Future.wait(calls);

      expect(refreshCalls, 1);
      for (final result in results) {
        expect(result, isA<ApiSuccess<String>>());
        expect((result as ApiSuccess<String>).data, 'ok with access-1');
      }
      final refresh = backend.requestsTo('POST', '/auth/refresh').single;
      expect(refresh.body, {'refreshToken': 'refresh-0'});
      expect(refresh.header('X-Device-ID'), deviceId);
      expect(refresh.header('Authorization'), isNull);
      // 3 originals (401) + 3 resends.
      expect(backend.requestsTo('GET', '/protected'), hasLength(6));
      expect(store.values[SecureStoreKeys.refreshToken], 'refresh-1');
    },
  );

  test('a later refresh sends the rotated token, never a used one', () async {
    rotatingRefresh();
    expect(await protectedCall(), isA<ApiSuccess<String>>());

    validAccess.remove('access-1'); // access-1 expires
    final result = await protectedCall();

    expect(result, isA<ApiSuccess<String>>());
    final sent = backend
        .requestsTo('POST', '/auth/refresh')
        .map((r) => (r.body! as Map<String, Object?>)['refreshToken'])
        .toList();
    expect(sent, ['refresh-0', 'refresh-1']);
  });

  test(
    'a 401 from an already-replaced access token does not refresh again',
    () async {
      rotatingRefresh();
      expect(await protectedCall(), isA<ApiSuccess<String>>());
      expect(refreshCalls, 1);

      final outcome = await container
          .read(tokenRefresherProvider)
          .refresh(failedAccessToken: 'access-0');

      expect(outcome, isA<RefreshSucceeded>());
      expect((outcome as RefreshSucceeded).tokens.accessToken, 'access-1');
      expect(refreshCalls, 1);
    },
  );

  test('a refused refresh ends the session: tokens cleared, event emitted, '
      'no retry loop', () async {
    backend.on('POST', '/auth/refresh', (r) {
      refreshCalls++;
      return FakeResponse.error(401, 'UNAUTHORIZED');
    });
    final events = <SessionEndReason>[];
    final sub = container.read(sessionEventsProvider).stream.listen(events.add);
    addTearDown(sub.cancel);

    final result = await protectedCall();
    await Future<void>.delayed(Duration.zero);

    expect(result, isA<ApiFailure<String>>());
    expect(
      (result as ApiFailure<String>).error.category,
      ErrorCategory.authentication,
    );
    expect(refreshCalls, 1);
    expect(backend.requestsTo('GET', '/protected'), hasLength(1));
    expect(store.values.containsKey(SecureStoreKeys.accessToken), isFalse);
    expect(store.values.containsKey(SecureStoreKeys.refreshToken), isFalse);
    expect(events, [SessionEndReason.expired]);
  });

  test('a refresh that cannot reach the server keeps the session', () async {
    backend.on('POST', '/auth/refresh', (r) {
      refreshCalls++;
      return const FakeResponse.networkError();
    });

    final result = await protectedCall();

    expect(result, isA<ApiFailure<String>>());
    expect(store.values[SecureStoreKeys.refreshToken], 'refresh-0');
  });

  test(
    'a second 401 after a successful refresh is final (resend once)',
    () async {
      backend.on('POST', '/auth/refresh', (r) {
        refreshCalls++;
        return FakeResponse.ok({
          'accessToken': 'access-1',
          'refreshToken': 'refresh-1',
          'expiresIn': 900,
        });
      });
      // access-1 is still refused.

      final result = await protectedCall();

      expect(result, isA<ApiFailure<String>>());
      expect(refreshCalls, 1);
      expect(backend.requestsTo('GET', '/protected'), hasLength(2));
    },
  );
}
