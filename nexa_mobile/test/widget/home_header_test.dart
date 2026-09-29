import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/app/theme/app_theme.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/home_header_bar.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fixtures.dart';
import '../helpers/test_app.dart';

/// Home header de-duplication: one status pill (connection + sync merged),
/// the trolley code once (badge) with its name only when it adds
/// information, and a footer that no longer repeats the status word.

DeviceContextSnapshot _context({
  String trolleyCode = 'A-01',
  String trolleyName = 'Trolley A-01',
}) => DeviceContextSnapshot(
  device: const DeviceInfo(
    id: deviceId,
    code: deviceCode,
    name: 'Tablet A-01',
    status: DeviceStatus.active,
  ),
  factory: const FactoryInfo(
    id: 'factory-1',
    code: 'FAC-A',
    name: 'Factory A',
    timezone: 'Asia/Jakarta',
  ),
  trolley: TrolleyInfo(
    id: 'trolley-1',
    code: trolleyCode,
    name: trolleyName,
    locationId: 'location-1',
  ),
  serverTime: DateTime.utc(2026, 9, 24, 8),
  syncCursor: 'cursor-1',
  fetchedAt: DateTime(2026, 9, 24, 7, 30),
);

Future<void> _pumpHeader(
  WidgetTester tester, {
  SyncOverview sync = const SyncOverview(),
  DeviceContextSnapshot? context,
  VoidCallback? onStatusTap,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(
        body: HomeHeaderBar(
          context_: context ?? _context(),
          picName: 'System Admin',
          sync: sync,
          onSettingsTap: () {},
          onStatusTap: onStatusTap,
        ),
      ),
    ),
  );
}

const _allStatusLabels = [
  AppStrings.online,
  AppStrings.offline,
  AppStrings.statusSyncing,
  AppStrings.statusSyncFailed,
];

/// Exactly one status indicator, showing [label] and nothing else from the
/// status vocabulary anywhere in the header.
void _expectSingleStatus(String label, {String? detail}) {
  final pill = find.byKey(const Key('home.status'));
  expect(pill, findsOneWidget);
  expect(find.descendant(of: pill, matching: find.text(label)), findsOneWidget);
  for (final other in _allStatusLabels) {
    expect(find.text(other), other == label ? findsOneWidget : findsNothing);
  }
  // The old separate sync text is gone.
  expect(find.byKey(const Key('home.syncStatus')), findsNothing);
  expect(find.text('Online'), findsNothing);
  final detailFinder = find.descendant(
    of: pill,
    matching: find.textContaining(AppStrings.statusPendingSuffix),
  );
  if (detail == null) {
    expect(detailFinder, findsNothing);
  } else {
    expect(
      find.descendant(of: pill, matching: find.text(detail)),
      findsOneWidget,
    );
  }
}

void main() {
  group('status pill — one indicator per state', () {
    testWidgets('online, nothing pending', (tester) async {
      await _pumpHeader(tester);
      _expectSingleStatus(AppStrings.online);
      expect(find.byIcon(Icons.wifi), findsOneWidget);
    });

    testWidgets('offline', (tester) async {
      await _pumpHeader(
        tester,
        sync: const SyncOverview(indicator: SyncIndicator.offline),
      );
      _expectSingleStatus(AppStrings.offline);
      expect(find.byIcon(Icons.wifi_off), findsOneWidget);
    });

    testWidgets('syncing', (tester) async {
      await _pumpHeader(
        tester,
        sync: const SyncOverview(pending: 2, indicator: SyncIndicator.syncing),
      );
      _expectSingleStatus(
        AppStrings.statusSyncing,
        detail: '· 2 ${AppStrings.statusPendingSuffix}',
      );
      expect(find.byIcon(Icons.sync), findsOneWidget);
    });

    testWidgets('sync failed / rejected', (tester) async {
      await _pumpHeader(
        tester,
        sync: const SyncOverview(failed: 1, indicator: SyncIndicator.syncError),
      );
      _expectSingleStatus(AppStrings.statusSyncFailed);
      expect(find.byIcon(Icons.sync_problem), findsOneWidget);
    });

    testWidgets('pending count on the pill when N > 0', (tester) async {
      await _pumpHeader(tester, sync: const SyncOverview(pending: 3));
      _expectSingleStatus(
        AppStrings.online,
        detail: '· 3 ${AppStrings.statusPendingSuffix}',
      );
    });

    testWidgets('offline with pending keeps one indicator', (tester) async {
      await _pumpHeader(
        tester,
        sync: const SyncOverview(pending: 1, indicator: SyncIndicator.offline),
      );
      _expectSingleStatus(
        AppStrings.offline,
        detail: '· 1 ${AppStrings.statusPendingSuffix}',
      );
    });

    testWidgets('tapping the pill calls onStatusTap', (tester) async {
      var taps = 0;
      await _pumpHeader(tester, onStatusTap: () => taps++);
      await tester.tap(find.byKey(const Key('home.status')));
      expect(taps, 1);
    });
  });

  group('trolley — code once, name only when it adds information', () {
    test('trolleyNameIfDistinct', () {
      expect(trolleyNameIfDistinct('A-01', 'Trolley A-01'), isNull);
      expect(trolleyNameIfDistinct('A-01', '  trolley a-01 '), isNull);
      expect(trolleyNameIfDistinct('A-01', 'TROLLEY   A-01'), isNull);
      expect(trolleyNameIfDistinct('A-01', 'a-01'), isNull);
      expect(trolleyNameIfDistinct('A-01', ''), isNull);
      expect(
        trolleyNameIfDistinct('A-01', 'Troli Jahit Line 3'),
        'Troli Jahit Line 3',
      );
      expect(
        trolleyNameIfDistinct('TROL-A-01', 'Trolley A-01'),
        'Trolley A-01',
      );
      expect(trolleyNameIfDistinct('A-01', 'Trolley A-012'), 'Trolley A-012');
    });

    testWidgets('name that only repeats the code is hidden', (tester) async {
      await _pumpHeader(tester);
      expect(find.text('TROLI A-01'), findsOneWidget);
      expect(find.byKey(const Key('home.trolleyName')), findsNothing);
      expect(find.textContaining('A-01 ·'), findsNothing);
      expect(find.text('Factory A'), findsOneWidget);
    });

    testWidgets('a distinct name shows under the badge', (tester) async {
      await _pumpHeader(
        tester,
        context: _context(trolleyName: 'Troli Jahit Line 3'),
      );
      expect(find.text('TROLI A-01'), findsOneWidget);
      expect(find.text('Troli Jahit Line 3'), findsOneWidget);
    });
  });

  testWidgets('footer: counts and last sync, no status word', (tester) async {
    for (final indicator in SyncIndicator.values) {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            syncOverviewProvider.overrideWithValue(
              SyncOverview(pending: 2, failed: 1, indicator: indicator),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: Scaffold(bottomNavigationBar: SyncFooter(onTap: () {})),
          ),
        ),
      );
      final text = tester
          .widget<Text>(find.byKey(const Key('home.syncFooter.text')))
          .data!;
      expect(
        text,
        '${AppStrings.syncPendingLabel}: 2   ·   '
        '${AppStrings.syncFailedLabel}: 1   ·   '
        '${AppStrings.syncLastLabel}: ${AppStrings.syncNever}',
      );
      for (final word in [..._allStatusLabels, 'Online', 'Offline']) {
        expect(text.toLowerCase(), isNot(contains(word.toLowerCase())));
      }
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    }
  });

  group('no overflow on the real tablet', () {
    for (final size in const [Size(1006, 553), Size(1340, 800)]) {
      testWidgets('header, widest status + distinct name at '
          '${size.width.toInt()}x${size.height.toInt()}', (tester) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);
        await _pumpHeader(
          tester,
          context: _context(trolleyName: 'Troli Jahit Line 3'),
          sync: const SyncOverview(
            pending: 12,
            failed: 3,
            indicator: SyncIndicator.syncError,
          ),
        );
        expect(tester.takeException(), isNull);
      });

      testWidgets('full Home at ${size.width.toInt()}x${size.height.toInt()}', (
        tester,
      ) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);
        final h = TestHarness.provisioned();
        await seedPreviousSession(h);
        h.backend
          ..on(
            'GET',
            '/mobile/bootstrap',
            (_) => FakeResponse.ok(bootstrapData()),
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

        expect(find.text('Factory A'), findsOneWidget);
        _expectSingleStatus(AppStrings.online);
        expect(find.byKey(const Key('home.syncFooter')), findsOneWidget);
        expect(tester.takeException(), isNull);
      });
    }
  });
}
