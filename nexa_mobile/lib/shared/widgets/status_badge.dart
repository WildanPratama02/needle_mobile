import 'package:flutter/material.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Icon + label + colour — status is never shown by colour alone
/// (Doc 07 §44, Doc 17 §36).
class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingMd,
        vertical: tokens.spacingSm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(tokens.radius),
        border: Border.all(color: color, width: 2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: tokens.iconSize),
          SizedBox(width: tokens.spacingSm),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge
                ?.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}

/// ONLINE / OFFLINE (Doc 07 §32, Doc 17 §29).
class NetworkIndicator extends StatelessWidget {
  const NetworkIndicator({super.key, required this.status});

  /// `null` while the first reading is pending — shown as offline-neutral.
  final ConnectivityStatus? status;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return switch (status) {
      ConnectivityStatus.online => StatusBadge(
        icon: Icons.wifi,
        label: AppStrings.online,
        color: tokens.success,
      ),
      _ => StatusBadge(
        icon: Icons.wifi_off,
        label: AppStrings.offline,
        color: tokens.neutral,
      ),
    };
  }
}
