import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../test/helpers/fake_backend.dart';
import '../test/helpers/fixtures.dart';
import '../test/helpers/test_app.dart';

/// Real-device regression check for the `PenukaranHariIniCard` `RenderFlex`
/// overflow found on a physical Galaxy Tab A7 Lite (1340x800 physical
/// resolution, ~1006.6x552.9 logical — confirmed by this test's own printed
/// `tester.view` reading). Unlike `first_launch_flow_test.dart`, this does
/// **not** override `tester.view` — it keeps the connected device's actual
/// reported size/density, because the bug only reproduced at that specific
/// device's real (smaller-than-the-synthetic-widget-test-surface) logical
/// height. It boots straight to Home via a seeded cached session
/// (`seedPreviousSession`, the same path `login_flow_test.dart`'s "offline
/// start with a stored session" test uses) rather than driving the
/// provisioning/login UI — tapping those screens' controls at this
/// device's real, narrower layout is a separate, pre-existing concern this
/// ticket does not cover. Also stubs the real 3-exchange-type bootstrap
/// payload (`BROKEN`/`BENT`/`CHANGEOVER`), not the 1-type shortcut the
/// other test fixtures use, since that gap is what let the bug through
/// `flutter test` in the first place.
///
/// Run with: `flutter test integration_test/home_dashboard_device_test.dart
/// -d ANDROID_DEVICE_ID`.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Home dashboard (incl. PENUKARAN HARI INI) renders on this device\'s '
    'real screen size with no RenderFlex overflow',
    (tester) async {
      final h = TestHarness.provisioned();
      await seedPreviousSession(h);
      h.backend
        ..on(
          'GET',
          '/mobile/bootstrap',
          (_) => FakeResponse.ok({
            ...bootstrapData(),
            'exchangeTypes': [
              {
                'id': 'et-1',
                'code': 'BROKEN',
                'name': 'Broken',
                'requiresFragmentValidation': true,
              },
              {
                'id': 'et-2',
                'code': 'BENT',
                'name': 'Bent',
                'requiresFragmentValidation': false,
              },
              {
                'id': 'et-3',
                'code': 'CHANGEOVER',
                'name': 'Changeover',
                'requiresFragmentValidation': false,
              },
            ],
          }),
        )
        ..on(
          'POST',
          '/devices/$deviceId/heartbeat',
          (_) => FakeResponse.ok(heartbeatData()),
        )
        ..on(
          'GET',
          '/inventory/trolleys/trolley-1',
          (_) => FakeResponse.ok({
            'trolleyId': 'trolley-1',
            'factoryId': 'factory-1',
            'items': <Object?>[],
          }),
        )
        ..on(
          'GET',
          '/exchanges',
          (_) => FakeResponse(200, {
            'success': true,
            'data': <Object?>[],
            'meta': {'requestId': 'req-1', 'total': 0},
          }),
        );

      await h.pumpApp(tester, overrideView: false);

      // ignore: avoid_print
      print(
        'Device physical size: ${tester.view.physicalSize}, '
        'devicePixelRatio: ${tester.view.devicePixelRatio}, '
        'logical size: ${tester.view.physicalSize / tester.view.devicePixelRatio}',
      );

      expect(find.text('Factory A'), findsOneWidget);
      expect(find.text(AppStrings.homeExchangesTodayTitle), findsOneWidget);
      expect(find.text('Broken'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
