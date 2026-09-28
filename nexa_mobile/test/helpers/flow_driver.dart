import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'fake_exchange_server.dart';
import 'test_app.dart';

/// Taps [key] once it is on screen (bounded wait), then lets the app settle.
Future<void> tapKey(WidgetTester tester, String key) async {
  final finder = find.byKey(Key(key));
  for (var i = 0; i < 20 && finder.evaluate().isEmpty; i++) {
    await settle(tester, rounds: 2);
  }
  expect(finder, findsOneWidget, reason: 'missing $key');
  await tester.ensureVisible(finder);
  await tester.tap(finder);
  await settle(tester);
}

/// Waits (bounded) until [finder] matches.
Future<void> waitFor(
  WidgetTester tester,
  Finder finder, {
  int tries = 30,
}) async {
  for (var i = 0; i < tries && finder.evaluate().isEmpty; i++) {
    await settle(tester, rounds: 2);
  }
  expect(finder, findsWidgets);
}

Finder stepFinder(String name) => find.byKey(Key('exchange.step.$name'));

Future<void> expectStep(WidgetTester tester, String name) =>
    waitFor(tester, stepFinder(name));

/// Home → wizard → RFID lookup → confirm operator (the online-only part).
Future<void> identifyOperatorOnline(WidgetTester tester) async {
  await tapKey(tester, 'home.newExchange');
  await expectStep(tester, 'scanOperator');
  await tester.enterText(find.byKey(const Key('exchange.rfid.input')), cardUid);
  await tapKey(tester, 'exchange.primary'); // CARI OPERATOR
  await expectStep(tester, 'confirmOperator');
  await tapKey(tester, 'exchange.primary'); // KONFIRMASI OPERATOR
  await expectStep(tester, 'oldNeedleType');
}

/// Old needle nt-1, then the exchange type [code].
Future<void> chooseTypes(WidgetTester tester, {String code = 'BENT'}) async {
  await tapKey(tester, 'needle.nt-1');
  await tapKey(tester, 'exchange.primary'); // LANJUTKAN
  await expectStep(tester, 'exchangeType');
  await tapKey(tester, 'exchange.type.$code');
}

Future<void> takePhoto(WidgetTester tester) async {
  await expectStep(tester, 'evidence');
  await tapKey(tester, 'evidence.capture');
  await tapKey(tester, 'evidence.use');
}
