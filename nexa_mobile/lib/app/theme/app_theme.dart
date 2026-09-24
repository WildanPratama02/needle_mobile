import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Material 3 theme, tablet-first (Doc 07 §42–44, Doc 17 §33–37).
///
/// Seed is the WebApps primary brand colour (`Docs/design.md` §4.2,
/// `ocean-600`) so both clients read as one product.
abstract final class AppTheme {
  static const Color seed = Color(0xFF0284C7);

  static ThemeData light() {
    const tokens = DesignTokens();
    final scheme = ColorScheme.fromSeed(seedColor: seed);
    final base = ThemeData(colorScheme: scheme, useMaterial3: true);
    // Larger type than phone defaults: read from normal tablet distance.
    final text = base.textTheme.apply(
      bodyColor: scheme.onSurface,
      displayColor: scheme.onSurface,
    );
    final textTheme = text.copyWith(
      bodyLarge: text.bodyLarge?.copyWith(fontSize: 20),
      bodyMedium: text.bodyMedium?.copyWith(fontSize: 18),
      labelLarge: text.labelLarge?.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.5,
      ),
      titleLarge: text.titleLarge?.copyWith(
        fontSize: 26,
        fontWeight: FontWeight.w700,
      ),
    );
    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(tokens.radius),
    );
    final minSize = Size(160, tokens.buttonHeight);

    return base.copyWith(
      textTheme: textTheme,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      extensions: const [tokens],
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: minSize,
          shape: buttonShape,
          textStyle: textTheme.labelLarge,
          padding: EdgeInsets.symmetric(horizontal: tokens.spacingLg),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: minSize,
          shape: buttonShape,
          textStyle: textTheme.labelLarge,
          side: BorderSide(color: scheme.primary, width: 2),
          padding: EdgeInsets.symmetric(horizontal: tokens.spacingLg),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: Size(96, tokens.buttonHeight),
          textStyle: textTheme.labelLarge,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          minimumSize: Size.square(tokens.buttonHeight),
          iconSize: tokens.iconSize,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radius),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: tokens.spacingMd,
          vertical: 20,
        ),
        labelStyle: textTheme.bodyLarge,
      ),
      appBarTheme: AppBarTheme(
        toolbarHeight: 72,
        titleTextStyle: textTheme.titleLarge,
        backgroundColor: scheme.surfaceContainer,
      ),
    );
  }
}
