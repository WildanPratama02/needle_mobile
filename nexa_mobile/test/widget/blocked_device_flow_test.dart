import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fixtures.dart';
import '../helpers/test_app.dart';

Future<void> _login(WidgetTester tester) async {
  await tester.enterText(find.byKey(const Key('login.username')), 'pic01');
  await tester.enterText(find.byKey(const Key('login.password')), 'secret');
  await tester.tap(find.byKey(const Key('login.submit')));
  await settle(tester);
}

void _loginOk(TestHarness h) => h.backend
  ..on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()))
  ..on('GET', '/auth/me', (_) => FakeResponse.ok(meData()))
  ..on('POST', '/auth/logout', (_) => const FakeResponse(204));

void main() {
  testWidgets('revoked device: login succeeds but the app is blocked '
      '(FR-MOB-002, MG-14)', (tester) async {
    final h = TestHarness.provisioned();
    _loginOk(h);
    h.backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.error(
        403,
        'DEVICE_INACTIVE',
        context: {'status': 'REVOKED'},
      ),
    );
    await h.pumpApp(tester);

    await _login(tester);

    expect(find.text(AppStrings.blockedTitle), findsOneWidget);
    expect(find.text(AppStrings.blockedRevoked), findsOneWidget);
    expect(find.byKey(const Key('home.newExchange')), findsNothing);
    expect(
      find.text(AppStrings.reprovision),
      findsNothing,
      reason: 'a PIC without DEVICE_MANAGE cannot re-provision',
    );

    // KELUAR ends the session and returns to login.
    await tester.tap(find.text(AppStrings.logout));
    await settle(tester);
    expect(find.byKey(const Key('login.submit')), findsOneWidget);
    expect(h.backend.requestsTo('POST', '/auth/logout'), hasLength(1));
  });

  testWidgets('inactive device: PERIKSA ULANG re-validates and lets the PIC in '
      'once the admin reactivates it', (tester) async {
    final h = TestHarness.provisioned();
    _loginOk(h);
    var active = false;
    h.backend
      ..on(
        'GET',
        '/mobile/bootstrap',
        (_) => active
            ? FakeResponse.ok(bootstrapData())
            : FakeResponse.error(
                403,
                'DEVICE_INACTIVE',
                context: {'status': 'INACTIVE'},
              ),
      )
      ..on(
        'POST',
        '/devices/$deviceId/heartbeat',
        (_) => FakeResponse.ok(heartbeatData()),
      );
    await h.pumpApp(tester);
    await _login(tester);
    expect(find.text(AppStrings.blockedInactive), findsOneWidget);

    active = true;
    await tester.tap(find.text(AppStrings.checkAgain));
    await settle(tester);

    expect(find.byKey(const Key('home.newExchange')), findsOneWidget);
  });

  testWidgets('a heartbeat answering DEVICE_INACTIVE blocks a running app', (
    tester,
  ) async {
    final h = TestHarness.provisioned();
    _loginOk(h);
    h.backend
      ..on('GET', '/mobile/bootstrap', (_) => FakeResponse.ok(bootstrapData()))
      ..on(
        'POST',
        '/devices/$deviceId/heartbeat',
        (_) => FakeResponse.error(
          403,
          'DEVICE_INACTIVE',
          context: {'status': 'REVOKED'},
        ),
      );
    await h.pumpApp(tester);

    await _login(tester);

    expect(find.text(AppStrings.blockedTitle), findsOneWidget);
    expect(find.byKey(const Key('home.newExchange')), findsNothing);
  });

  testWidgets('unknown device id (404 DEVICE_NOT_FOUND) → back to '
      'provisioning', (tester) async {
    final h = TestHarness.provisioned();
    _loginOk(h);
    h.backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.error(404, 'DEVICE_NOT_FOUND'),
    );
    await h.pumpApp(tester);

    await _login(tester);

    expect(find.text(AppStrings.provisionTitle), findsOneWidget);
    expect(find.text(AppStrings.deviceNotRegisteredNotice), findsOneWidget);
    expect(h.secureStore.values.containsKey(SecureStoreKeys.deviceId), isFalse);
    expect(
      h.secureStore.values.containsKey(SecureStoreKeys.refreshToken),
      isFalse,
      reason: 'the session was tied to the forgotten device id',
    );
  });

  testWidgets('user without access to this device sees AKSES DITOLAK', (
    tester,
  ) async {
    final h = TestHarness.provisioned();
    _loginOk(h);
    h.backend.on(
      'GET',
      '/mobile/bootstrap',
      (_) => FakeResponse.error(403, 'FORBIDDEN'),
    );
    await h.pumpApp(tester);

    await _login(tester);

    expect(find.text(AppStrings.accessDeniedTitle), findsOneWidget);
  });
}
