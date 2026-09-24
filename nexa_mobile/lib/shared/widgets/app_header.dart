import 'package:flutter/material.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/status_badge.dart';

/// Status header (Doc 17 §5): Factory | Trolley | PIC and the network status.
/// Kept low so the transaction area stays dominant.
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({
    super.key,
    required this.factoryName,
    required this.trolleyName,
    required this.picName,
    required this.connectivity,
    this.actions = const [],
  });

  final String factoryName;
  final String trolleyName;
  final String picName;
  final ConnectivityStatus? connectivity;
  final List<Widget> actions;

  @override
  Size get preferredSize => const Size.fromHeight(88);

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    Widget field(String label, String value) => Flexible(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelMedium),
          Text(
            value,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleLarge,
          ),
        ],
      ),
    );
    return Material(
      color: theme.colorScheme.surfaceContainer,
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: preferredSize.height,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: tokens.spacingLg),
            child: Row(
              children: [
                field(AppStrings.factory, factoryName),
                SizedBox(width: tokens.spacingXl),
                field(AppStrings.trolley, trolleyName),
                SizedBox(width: tokens.spacingXl),
                field(AppStrings.pic, picName),
                const Spacer(),
                NetworkIndicator(status: connectivity),
                ...actions,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
