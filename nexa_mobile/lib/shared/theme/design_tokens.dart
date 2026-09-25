import 'package:flutter/material.dart';

/// Central design tokens (Doc 17 §55) as a [ThemeExtension]
/// (`Flutter_rules/rules.md` §Design Tokens).
@immutable
class DesignTokens extends ThemeExtension<DesignTokens> {
  const DesignTokens({
    this.spacingXs = 4,
    this.spacingSm = 8,
    this.spacingMd = 16,
    this.spacingLg = 24,
    this.spacingXl = 40,
    this.radius = 12,
    this.buttonHeight = 64,
    this.primaryActionHeight = 112,
    this.iconSize = 28,
    this.maxContentWidth = 720,
    this.success = const Color(0xFF15803D),
    this.warning = const Color(0xFFB45309),
    this.danger = const Color(0xFFB91C1C),
    this.neutral = const Color(0xFF475569),
    this.headerBackground = const Color(0xFF0F1B3D),
    this.ctaBackground = const Color(0xFF0E6E6E),
    this.ctaBackgroundDark = const Color(0xFF0A5757),
    this.pageBackground = const Color(0xFFEFF2F7),
    this.trolleyPillBackground = const Color(0xFF2F6FED),
    this.cardShadow = const [
      BoxShadow(color: Color(0x1A0F1B3D), blurRadius: 24, offset: Offset(0, 8)),
    ],
  });

  final double spacingXs;
  final double spacingSm;
  final double spacingMd;
  final double spacingLg;
  final double spacingXl;
  final double radius;

  /// Every button: Doc 17 §34 asks for ≥ 56 dp.
  final double buttonHeight;

  /// The dominant action on a screen (Home "PENUKARAN BARU").
  final double primaryActionHeight;
  final double iconSize;

  /// Forms and messages stay readable on a wide landscape tablet.
  final double maxContentWidth;

  /// Status colours sit outside the blue brand family on purpose
  /// (`Docs/design.md` §4.1) and are always paired with an icon and a label.
  final Color success;
  final Color warning;
  final Color danger;
  final Color neutral;

  /// Dashboard/status-bar background (Home, Doc 17 §7 reference layout).
  final Color headerBackground;

  /// The "TUKAR JARUM" primary-action card (Home, Doc 17 §7).
  final Color ctaBackground;
  final Color ctaBackgroundDark;

  /// Scaffold background behind white content cards.
  final Color pageBackground;

  /// The trolley-code badge in the Home header.
  final Color trolleyPillBackground;
  final List<BoxShadow> cardShadow;

  @override
  DesignTokens copyWith({double? buttonHeight, double? primaryActionHeight}) =>
      DesignTokens(
        spacingXs: spacingXs,
        spacingSm: spacingSm,
        spacingMd: spacingMd,
        spacingLg: spacingLg,
        spacingXl: spacingXl,
        radius: radius,
        buttonHeight: buttonHeight ?? this.buttonHeight,
        primaryActionHeight: primaryActionHeight ?? this.primaryActionHeight,
        iconSize: iconSize,
        maxContentWidth: maxContentWidth,
        success: success,
        warning: warning,
        danger: danger,
        neutral: neutral,
        headerBackground: headerBackground,
        ctaBackground: ctaBackground,
        ctaBackgroundDark: ctaBackgroundDark,
        pageBackground: pageBackground,
        trolleyPillBackground: trolleyPillBackground,
        cardShadow: cardShadow,
      );

  @override
  DesignTokens lerp(ThemeExtension<DesignTokens>? other, double t) {
    if (other is! DesignTokens) return this;
    return DesignTokens(
      spacingXs: spacingXs,
      spacingSm: spacingSm,
      spacingMd: spacingMd,
      spacingLg: spacingLg,
      spacingXl: spacingXl,
      radius: radius,
      buttonHeight: buttonHeight,
      primaryActionHeight: primaryActionHeight,
      iconSize: iconSize,
      maxContentWidth: maxContentWidth,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      neutral: Color.lerp(neutral, other.neutral, t)!,
      headerBackground: Color.lerp(headerBackground, other.headerBackground, t)!,
      ctaBackground: Color.lerp(ctaBackground, other.ctaBackground, t)!,
      ctaBackgroundDark: Color.lerp(
        ctaBackgroundDark,
        other.ctaBackgroundDark,
        t,
      )!,
      pageBackground: Color.lerp(pageBackground, other.pageBackground, t)!,
      trolleyPillBackground: Color.lerp(
        trolleyPillBackground,
        other.trolleyPillBackground,
        t,
      )!,
      cardShadow: t < 0.5 ? cardShadow : other.cardShadow,
    );
  }
}

extension DesignTokensContext on BuildContext {
  DesignTokens get tokens =>
      Theme.of(this).extension<DesignTokens>() ?? const DesignTokens();
}
