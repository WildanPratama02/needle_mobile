import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Shown only when Home is rendering a cached device context because the
/// last bootstrap could not reach the backend (`ValidationPassed.fromCache`,
/// FR-MOB-002). Not in the NEXA.png reference (a happy-path screenshot) —
/// kept because losing this warning would let the PIC trust a stale
/// factory/trolley binding without knowing it (Doc 07 §4).
class CachedContextBanner extends StatelessWidget {
  const CachedContextBanner({super.key, required this.cachedSince});

  final DateTime cachedSince;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return Material(
      color: tokens.warning.withValues(alpha: 0.12),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: tokens.spacingLg,
          vertical: tokens.spacingSm,
        ),
        child: Row(
          children: [
            Icon(
              Icons.history_toggle_off,
              size: tokens.iconSize,
              color: tokens.warning,
            ),
            SizedBox(width: tokens.spacingSm),
            Text(
              '${AppStrings.cachedContextSince} ${_hhmm(cachedSince)}',
              key: const Key('home.cachedNotice'),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: tokens.warning,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _hhmm(DateTime t) {
    final local = t.toLocal();
    String two(int v) => v.toString().padLeft(2, '0');
    return '${two(local.hour)}:${two(local.minute)}';
  }
}
