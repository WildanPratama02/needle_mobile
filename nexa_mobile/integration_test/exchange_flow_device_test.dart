import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import '../test/helpers/fake_exchange_server.dart';
import '../test/helpers/test_app.dart';

/// Happy BENT exchange on a real device/emulator (Doc 07 §59 "normal path"),
/// at the device's own screen size — the Galaxy Tab A7 Lite gives about
/// 1006x553 dp in landscape, far less height than the widget-test surface.
///
/// Backend, RFID reader and camera are faked (hardware needs a physical
/// check, Doc 07 §58). Run with:
/// `flutter test integration_test/exchange_flow_device_test.dart -d <id>`.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(Key(key));
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await settle(tester);
  }

  testWidgets('BENT: RFID → type → photo → new needle → issue → store → '
      'complete', (tester) async {
    final h = TestHarness.provisioned();
    final server = FakeExchangeServer(h.backend)..install();
    await seedPreviousSession(h);
    await h.pumpApp(tester, overrideView: false);

    await tap(tester, 'home.newExchange');
    await tester.enterText(
      find.byKey(const Key('exchange.rfid.input')),
      cardUid,
    );
    await tap(tester, 'exchange.primary');
    await tap(tester, 'exchange.primary');
    await tap(tester, 'needle.nt-1');
    await tap(tester, 'exchange.primary');
    await tap(tester, 'exchange.type.BENT');
    await tap(tester, 'evidence.capture');
    await tap(tester, 'evidence.use');
    for (var i = 0; i < 4; i++) {
      await tap(
        tester,
        'exchange.primary',
      ); // new needle, issue, store, complete
    }

    expect(find.byKey(const Key('exchange.step.done')), findsOneWidget);
    expect(server.state, 'COMPLETED');
    expect(tester.takeException(), isNull, reason: 'no layout overflow');
  });
}
