import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fixtures.dart';
import '../helpers/test_app.dart';

void _happyBackend(TestHarness h) {
  h.backend
    ..on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()))
    ..on('GET', '/auth/me', (_) => FakeResponse.ok(meData()))
    ..on('GET', '/mobile/bootstrap', (_) => FakeResponse.ok(bootstrapData()))
    ..on(
      'POST',
      '/devices/$deviceId/heartbeat',
      (_) => FakeResponse.ok(heartbeatData()),
    );
}

Future<void> _login(WidgetTester tester, {String password = 'secret'}) async {
  await tester.enterText(find.byKey(const Key('login.username')), 'pic01');
  await tester.enterText(find.byKey(const Key('login.password')), password);
  await tester.tap(find.byKey(const Key('login.submit')));
  await settle(tester);
}

void main() {
  testWidgets('login → device validation → Home with factory/trolley context '
      '(FR-MOB-001, FR-MOB-002, Doc 07 §8)', (tester) async {
    final h = TestHarness.provisioned();
    _happyBackend(h);
    await h.pumpApp(tester);

    expect(find.byKey(const Key('login.submit')), findsOneWidget);
    expect(find.text('${AppStrings.loginDevice}: $deviceCode'), findsOneWidget);

    await _login(tester);

    // Home: context from the device binding, connection status, actions.
    expect(find.text('Factory A'), findsOneWidget);
    expect(find.text('TROL-A-01 · Trolley A-01'), findsOneWidget);
    expect(find.text('Budi Santoso'), findsOneWidget);
    expect(find.text(AppStrings.online), findsOneWidget);
    expect(find.byKey(const Key('home.newExchange')), findsOneWidget);
    expect(find.byKey(const Key('home.trolleyStock')), findsOneWidget);
    expect(find.byKey(const Key('home.history')), findsOneWidget);
    expect(find.text(AppStrings.syncAllDone), findsOneWidget);

    // MG-14: bootstrap straight after login; X-Device-ID on login and every
    // tablet call.
    final login = h.backend.requestsTo('POST', '/auth/login').single;
    expect(login.header('X-Device-ID'), deviceId);
    final bootstrap = h.backend.requestsTo('GET', '/mobile/bootstrap').single;
    expect(bootstrap.header('X-Device-ID'), deviceId);
    expect(bootstrap.header('Authorization'), 'Bearer access-1');

    // Heartbeat on start (Docs/12 §9).
    final beat = h.backend
        .requestsTo('POST', '/devices/$deviceId/heartbeat')
        .first;
    expect((beat.body! as Map<String, Object?>)['appVersion'], '1.0.0+1');

    // Home buttons whose feature is not built yet lead to placeholders
    // (TUKAR JARUM now opens the exchange flow — exchange_flow_test.dart).
    await tester.tap(find.byKey(const Key('home.history')));
    await settle(tester);
    expect(find.text(AppStrings.featurePending), findsOneWidget);
  });

  testWidgets('wrong password: safe message, stays on login, no refresh', (
    tester,
  ) async {
    final h = TestHarness.provisioned();
    h.backend.on(
      'POST',
      '/auth/login',
      (_) => FakeResponse.error(
        401,
        'UNAUTHORIZED',
        message: 'Invalid credentials',
      ),
    );
    await h.pumpApp(tester);

    await _login(tester, password: 'wrong');

    expect(find.text(AppStrings.loginInvalidCredentials), findsOneWidget);
    expect(find.textContaining('Invalid credentials'), findsNothing);
    expect(find.byKey(const Key('login.submit')), findsOneWidget);
    expect(h.backend.requestsTo('POST', '/auth/refresh'), isEmpty);
    expect(h.backend.requestsTo('GET', '/mobile/bootstrap'), isEmpty);
  });

  testWidgets('empty fields are refused without calling the backend', (
    tester,
  ) async {
    final h = TestHarness.provisioned();
    await h.pumpApp(tester);

    await tester.tap(find.byKey(const Key('login.submit')));
    await settle(tester);

    expect(find.text(AppStrings.loginFieldsRequired), findsOneWidget);
    expect(h.backend.requests, isEmpty);
  });

  testWidgets('offline start with a stored session shows the cached context', (
    tester,
  ) async {
    final h = TestHarness.provisioned();
    h.connectivity.status = ConnectivityStatus.offline;
    await seedPreviousSession(h);
    h.backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => const FakeResponse.networkError(),
    );

    await h.pumpApp(tester);

    expect(find.text('Factory A'), findsOneWidget);
    expect(find.text(AppStrings.offline), findsOneWidget);
    expect(find.byKey(const Key('home.cachedNotice')), findsOneWidget);
    expect(
      h.backend.requestsTo('POST', '/devices/$deviceId/heartbeat'),
      isEmpty,
      reason: 'no heartbeat while offline',
    );
  });

  testWidgets('refused refresh token → login with "session expired" '
      '(Doc 17 §40)', (tester) async {
    final h = TestHarness.provisioned();
    await seedPreviousSession(h);
    h.backend
      ..on(
        'GET',
        '/mobile/bootstrap',
        (_) => FakeResponse.error(401, 'UNAUTHORIZED'),
      )
      ..on(
        'POST',
        '/auth/refresh',
        (_) => FakeResponse.error(401, 'UNAUTHORIZED'),
      );

    await h.pumpApp(tester);

    expect(find.byKey(const Key('login.submit')), findsOneWidget);
    expect(find.text(AppStrings.sessionExpired), findsOneWidget);
    expect(h.backend.requestsTo('POST', '/auth/refresh'), hasLength(1));
    expect(
      h.secureStore.values.containsKey(SecureStoreKeys.refreshToken),
      isFalse,
    );
  });
}
