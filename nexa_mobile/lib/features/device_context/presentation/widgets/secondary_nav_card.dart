import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';

/// Small icon + title + subtitle nav card — reused for "Riwayat" and
/// "Status Sinkron" at the bottom of Home (Doc 17 §7 reference layout).
class SecondaryNavCard extends StatelessWidget {
  const SecondaryNavCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  /// Below this height (e.g. the Galaxy Tab A7 Lite's ~553 dp landscape
  /// with the Home footer) title and subtitle share one line instead of
  /// overflowing; the text keeps its size.
  static const _compactBelow = 80.0;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final tokens = context.tokens;
    final card = LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < _compactBelow;
        final text = compact
            ? Text.rich(
                TextSpan(
                  children: [
                    TextSpan(text: title, style: textTheme.titleMedium),
                    TextSpan(
                      text: '  ·  $subtitle',
                      style: textTheme.bodySmall,
                    ),
                  ],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              );
        return AppCard(
          padding: compact
              ? const EdgeInsets.symmetric(horizontal: 16, vertical: 4)
              : const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              SizedBox(width: tokens.spacingMd),
              Expanded(child: text),
            ],
          ),
        );
      },
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: card,
      ),
    );
  }
}
