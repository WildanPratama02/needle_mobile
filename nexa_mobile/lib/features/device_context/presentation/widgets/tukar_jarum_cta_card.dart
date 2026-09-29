import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// The screen's single primary action (Doc 07 §43): starts a new Exchange.
///
/// Functionally this is FR-MOB-003 "Create Exchange" (Docs/07 §10). Doc 07's
/// wireframe calls the button "NEW EXCHANGE" and Doc 17's wireframe calls it
/// "+ PENUKARAN BARU"; the reference design's copy ("TUKAR JARUM") is used
/// on screen since matching the reference was the explicit ask for this
/// screen, but all three trigger the same domain action and the same route
/// (`Routes.newExchange`) — a draft Exchange, then the RFID-operator step
/// (Doc 17 §8).
class TukarJarumCtaCard extends StatelessWidget {
  const TukarJarumCtaCard({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        key: const Key('home.newExchange'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [tokens.ctaBackground, tokens.ctaBackgroundDark],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: tokens.cardShadow,
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF4C430),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.credit_card,
                    color: tokens.ctaBackgroundDark,
                    size: 26,
                  ),
                ),
                SizedBox(height: tokens.spacingLg),
                Text(
                  AppStrings.homeCtaTitle,
                  style: textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: tokens.spacingSm),
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: tokens.spacingLg,
                  ),
                  child: Text(
                    AppStrings.homeCtaSubtitle,
                    style: textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFFD7ECEC),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
