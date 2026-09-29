import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fixtures.dart';
import '../helpers/test_app.dart';

/// The Home dashboard (Doc 07 §8, Doc 17 §7 reference layout): trolley
/// stock, today's exchange count and the exchange-type breakdown card, all
/// wired to real repositories behind the shared `ApiClient` — not mocked
/// data (see `.scratch/mobile-troli-app/issues/` for what is still a
/// documented contract gap).
void _happyBackend(FakeBackend backend) {
  backend
    ..on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()))
    ..on('GET', '/auth/me', (_) => FakeResponse.ok(meData()))
    ..on('GET', '/mobile/bootstrap', (_) => FakeResponse.ok(bootstrapData()))
    ..on(
      'POST',
      '/devices/$deviceId/heartbeat',
      (_) => FakeResponse.ok(heartbeatData()),
    );
}

Future<void> _login(WidgetTester tester) async {
  await tester.enterText(find.byKey(const Key('login.username')), 'pic01');
  await tester.enterText(find.byKey(const Key('login.password')), 'secret');
  await tester.tap(find.byKey(const Key('login.submit')));
  await settle(tester);
}

void main() {
  testWidgets(
    'shows real trolley stock (with MENIPIS/KRITIS badges) and today\'s '
    "exchange count from the backend, and doesn't fabricate the missing "
    'per-type breakdown',
    (tester) async {
      final h = TestHarness.provisioned();
      _happyBackend(h.backend);
      h.backend
        ..on(
          'GET',
          '/inventory/trolleys/trolley-1',
          (_) => FakeResponse.ok({
            'trolleyId': 'trolley-1',
            'factoryId': 'factory-1',
            'items': [
              {
                'needleTypeId': 'nt-1',
                'needleTypeCode': 'DBX1-14',
                'quantity': 40,
                'minimumStock': 10,
                'stockStatus': 'NORMAL',
              },
              {
                'needleTypeId': 'nt-2',
                'needleTypeCode': 'DPX5-14',
                'quantity': 5,
                'minimumStock': 20,
                'stockStatus': 'OUT',
              },
            ],
          }),
        )
        ..on(
          'GET',
          '/exchanges',
          (_) => FakeResponse(200, {
            'success': true,
            'data': <Object?>[],
            'meta': {'requestId': 'req-1', 'total': 12},
          }),
        );

      await h.pumpApp(tester);
      await _login(tester);

      // TUKAR JARUM is still the one primary action.
      expect(find.text(AppStrings.homeCtaTitle), findsOneWidget);

      // Real trolley stock, joined with the bootstrap needle-type name
      // (`nt-1` → "DBx1 #14"), and status badges for LOW/OUT rows.
      expect(find.text(AppStrings.homeStockTitle), findsOneWidget);
      expect(find.text('DBx1 #14'), findsOneWidget);
      expect(find.text('40'), findsOneWidget);
      expect(find.text('DPX5-14'), findsOneWidget, reason: 'no bootstrap match — falls back to code');
      expect(find.text('KRITIS'), findsOneWidget);

      // Real today's-exchange count via GET /exchanges meta.total.
      expect(find.text('${AppStrings.homeHistorySubtitlePrefix}12'), findsOneWidget);

      // The by-type breakdown has no aggregate endpoint yet — real exchange
      // type names, but the count is honestly flagged unavailable, not
      // fabricated.
      expect(find.text(AppStrings.homeExchangesTodayTitle), findsOneWidget);
      expect(find.text('Broken'), findsOneWidget);
      expect(find.text(AppStrings.homeExchangesTodayUnavailable), findsOneWidget);
    },
  );

  testWidgets(
    'a failed trolley-stock call degrades to an unavailable message, never '
    'crashes Home',
    (tester) async {
      final h = TestHarness.provisioned();
      _happyBackend(h.backend);
      // /inventory/trolleys and /exchanges are left unstubbed — the fake
      // backend answers 404, exercising the same failure path as offline.

      await h.pumpApp(tester);
      await _login(tester);

      expect(find.text(AppStrings.homeStockUnavailable), findsOneWidget);
      expect(find.text(AppStrings.homeHistoryCountUnavailable), findsOneWidget);
    },
  );
}
