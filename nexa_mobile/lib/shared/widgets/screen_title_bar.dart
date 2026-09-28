import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/status_badge.dart';

/// The dark title bar of a secondary screen (Pending Sync, history, stock):
/// back, title, optional subtitle, and the network indicator (Doc 17 §29).
class ScreenTitleBar extends StatelessWidget {
  const ScreenTitleBar({
    super.key,
    required this.title,
    required this.connectivity,
    required this.backKey,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final ConnectivityStatus? connectivity;
  final Key backKey;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return Container(
      color: tokens.headerBackground,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacingSm,
            vertical: tokens.spacingXs,
          ),
          child: Row(
            children: [
              IconButton(
                key: backKey,
                tooltip: AppStrings.back,
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.pop(),
              ),
              SizedBox(width: tokens.spacingSm),
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                ),
              ),
              if (subtitle != null) ...[
                SizedBox(width: tokens.spacingMd),
                Flexible(
                  child: Text(
                    subtitle!,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white70,
                    ),
                  ),
                ),
              ],
              const Spacer(),
              NetworkIndicator(status: connectivity),
              SizedBox(width: tokens.spacingSm),
            ],
          ),
        ),
      ),
    );
  }
}
