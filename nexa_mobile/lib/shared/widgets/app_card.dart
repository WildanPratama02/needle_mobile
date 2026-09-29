import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// A white, rounded, soft-shadow surface card (Doc 17 §7 reference layout).
///
/// This is the one card shell every dashboard/list screen should reuse —
/// don't build a second `Container` + `BoxDecoration` combination for
/// "a white rounded card with a shadow" anywhere else in the app.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  /// Overrides the default surface color (e.g. for the teal CTA card).
  /// Leave null to use [ColorScheme.surface].
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: tokens.cardShadow,
      ),
      child: child,
    );
  }
}
