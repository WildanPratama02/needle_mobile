import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import '../test/helpers/fake_backend.dart';
import '../test/helpers/fixtures.dart';
import '../test/helpers/test_app.dart';

/// First-launch flow on a real device/emulator (Doc 07 §59):
/// provisioning (manual entry) → login → device validation → Home.
///
/// The backend is faked so the flow is deterministic; the camera is faked
/// because QR scanning needs a physical tablet and a printed code (Doc 07
/// §58). Run with: `flutter test integration_test -d <android-device>`.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('provision → login → Home', (tester) async {
    final h = TestHarness();
    h.backend
      ..on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()))
      ..on('GET', '/auth/me', (_) => FakeResponse.ok(meData()))
      ..on('GET', '/mobile/bootstrap', (_) => FakeResponse.ok(bootstrapData()))
      ..on(
        'POST',
        '/devices/$deviceId/heartbeat',
        (_) => FakeResponse.ok(heartbeatData()),
      );
    await h.pumpApp(tester);

    await tester.tap(find.byKey(const Key('provision.toManual')));
    await settle(tester);
    await tester.enterText(
      find.byKey(const Key('provision.manualInput')),
      deviceId,
    );
    await tester.tap(find.byKey(const Key('provision.manualSave')));
    await settle(tester);

    await tester.enterText(find.byKey(const Key('login.username')), 'pic01');
    await tester.enterText(find.byKey(const Key('login.password')), 'secret');
    await tester.tap(find.byKey(const Key('login.submit')));
    await settle(tester);

    expect(find.text('Factory A'), findsOneWidget);
    // FR-MOB-003 "Create Exchange" — on-screen copy is the reference
    // design's "TUKAR JARUM" card; the key is the stable contract.
    expect(find.byKey(const Key('home.newExchange')), findsOneWidget);
  });
}
