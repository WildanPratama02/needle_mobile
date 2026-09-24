import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fixtures.dart';
import '../helpers/test_app.dart';

void main() {
  testWidgets('first launch without a device id opens provisioning in scan '
      'mode (MG-1)', (tester) async {
    final h = TestHarness();
    await h.pumpApp(tester);

    expect(find.text(AppStrings.provisionTitle), findsOneWidget);
    expect(find.text(AppStrings.provisionScanHint), findsOneWidget);
    expect(find.text('camera preview'), findsOneWidget);
    expect(h.scanner.started, isTrue);
    expect(h.backend.requests, isEmpty);
  });

  testWidgets('manual entry: an invalid id is refused, a valid UUID is stored '
      'and leads to login', (tester) async {
    final h = TestHarness();
    await h.pumpApp(tester);

    await tester.tap(find.byKey(const Key('provision.toManual')));
    await settle(tester);
    expect(find.text('camera preview'), findsNothing);

    await tester.enterText(
      find.byKey(const Key('provision.manualInput')),
      'TAB-A-01',
    );
    await tester.tap(find.byKey(const Key('provision.manualSave')));
    await settle(tester);
    expect(find.text(AppStrings.manualInvalidDeviceId), findsOneWidget);
    expect(h.secureStore.values.containsKey(SecureStoreKeys.deviceId), isFalse);

    await tester.enterText(
      find.byKey(const Key('provision.manualInput')),
      ' ${deviceId.toUpperCase()} ',
    );
    await tester.tap(find.byKey(const Key('provision.manualSave')));
    await settle(tester);

    expect(h.secureStore.values[SecureStoreKeys.deviceId], deviceId);
    expect(find.byKey(const Key('login.submit')), findsOneWidget);
    expect(find.text('${AppStrings.loginDevice}: $deviceId'), findsOneWidget);
  });

  testWidgets('QR scan: rejects a foreign QR, confirms the device code before '
      'storing', (tester) async {
    final h = TestHarness();
    await h.pumpApp(tester);

    h.scanner.scan('https://example.com/not-a-device');
    await settle(tester);
    expect(find.text(AppStrings.qrNotJson), findsOneWidget);

    h.scanner.scan(
      '{"type":"needle-device","v":2,"deviceId":"$deviceId","deviceCode":"X"}',
    );
    await settle(tester);
    expect(find.text(AppStrings.qrUnsupportedVersion), findsOneWidget);

    h.scanner.scan(
      '{"type":"needle-device","v":1,"deviceId":"$deviceId","deviceCode":"$deviceCode"}',
    );
    await settle(tester);
    expect(find.byKey(const Key('provision.scannedCode')), findsOneWidget);
    expect(find.text(deviceCode), findsOneWidget);
    expect(
      h.secureStore.values.containsKey(SecureStoreKeys.deviceId),
      isFalse,
      reason: 'nothing is stored before the operator confirms',
    );

    await tester.tap(find.byKey(const Key('provision.confirm')));
    await settle(tester);

    expect(h.secureStore.values[SecureStoreKeys.deviceId], deviceId);
    expect(h.secureStore.values[SecureStoreKeys.deviceCode], deviceCode);
    expect(find.text('${AppStrings.loginDevice}: $deviceCode'), findsOneWidget);
  });

  testWidgets('camera unavailable falls back to manual entry', (tester) async {
    final h = TestHarness();
    await h.pumpApp(tester);

    h.scanner.fail();
    await settle(tester);

    expect(find.byKey(const Key('provision.manualInput')), findsOneWidget);
    expect(find.text(AppStrings.provisionCameraUnavailable), findsOneWidget);
  });
}
