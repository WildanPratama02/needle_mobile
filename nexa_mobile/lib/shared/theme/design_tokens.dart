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
    );
  }
}

extension DesignTokensContext on BuildContext {
  DesignTokens get tokens =>
      Theme.of(this).extension<DesignTokens>() ?? const DesignTokens();
}
