import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/widgets/message_panel.dart';

/// Target of Home buttons whose feature is not built yet (exchange, stock,
/// history land in later phases of Docs/21).
class FeaturePendingScreen extends StatelessWidget {
  const FeaturePendingScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: MessagePanel(
        icon: Icons.construction,
        iconColor: Theme.of(context).colorScheme.primary,
        title: title,
        body: AppStrings.featurePending,
        primaryLabel: AppStrings.back,
        onPrimary: () => context.pop(),
      ),
    );
  }
}
