import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/penukaran_hari_ini_card.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

/// Regression test for the on-device overflow found on a physical Galaxy
/// Tab A7 Lite. `flutter test` never caught it because the shared bootstrap
/// test fixture (`test/helpers/fixtures.dart`) only stubs one exchange
/// type, while real `/mobile/bootstrap` data has three (`BROKEN`, `BENT`,
/// `CHANGEOVER` — CONTEXT.md "Exchange Type"). The crash report's
/// `RenderFlex` was the card's *inner* (data-case) `Column`, constrained to
/// `BoxConstraints(0.0<=w<=341.8, h=72.3)` — i.e. what's left after
/// `AppCard`'s padding and the card title/spacing are subtracted from the
/// outer box, not the card's total height. `_pumpCardAtBodyHeight` measures
/// the title's real rendered height for the active text theme first, then
/// sizes the outer box so the inner body region reproduces that exact
/// 72.3px constraint, rather than hardcoding a font-metric assumption.
const _threeRealExchangeTypes = [
  ExchangeType(
    id: 'et-1',
    code: 'BROKEN',
    name: 'Broken',
    requiresFragmentValidation: true,
  ),
  ExchangeType(
    id: 'et-2',
    code: 'BENT',
    name: 'Bent',
    requiresFragmentValidation: false,
  ),
  ExchangeType(
    id: 'et-3',
    code: 'CHANGEOVER',
    name: 'Changeover',
    requiresFragmentValidation: false,
  ),
];

/// [AppCard]'s default `EdgeInsets.all(16)` (top+bottom / left+right).
const _cardPadding = 32.0;

/// [DesignTokens.spacingMd]'s default (the gap between the title and the
/// body `Expanded`).
const _spacingMd = 16.0;

Future<void> _pumpCardAtBodyHeight(
  WidgetTester tester, {
  required List<ExchangeType> exchangeTypes,
  required double bodyHeight,
  double bodyWidth = 341.8,
}) async {
  Future<void> pump(double outerHeight) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          exchangeTypesProvider.overrideWith((ref) async => exchangeTypes),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: Align(
              alignment: Alignment.topLeft,
              child: SizedBox(
                width: bodyWidth + _cardPadding,
                height: outerHeight,
                child: const PenukaranHariIniCard(),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();
  }

  // First pump generously to measure the title's real rendered height for
  // the active text theme.
  await pump(400);
  final titleHeight = tester
      .getSize(find.text(AppStrings.homeExchangesTodayTitle))
      .height;

  // Then reproduce the crash's exact body constraint.
  await pump(_cardPadding + titleHeight + _spacingMd + bodyHeight);
}

void main() {
  testWidgets(
    'does not overflow with the real 3-exchange-type bootstrap payload at '
    "the crash report's exact body constraint (w<=341.8, h=72.3)",
    (tester) async {
      await _pumpCardAtBodyHeight(
        tester,
        exchangeTypes: _threeRealExchangeTypes,
        bodyHeight: 72.3,
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Broken'), findsOneWidget);
      // The list is bounded/scrollable now, so an off-screen row may not be
      // laid out — the point of this test is "no overflow", not that every
      // row is simultaneously visible in a box this tight.
    },
  );

  testWidgets(
    'does not overflow even tighter, with more exchange types than exist '
    'today (defensive against future master-data growth)',
    (tester) async {
      await _pumpCardAtBodyHeight(
        tester,
        exchangeTypes: [
          ..._threeRealExchangeTypes,
          const ExchangeType(
            id: 'et-4',
            code: 'OTHER',
            name: 'Another Type',
            requiresFragmentValidation: false,
          ),
        ],
        bodyHeight: 40,
      );

      expect(tester.takeException(), isNull);
    },
  );
}
