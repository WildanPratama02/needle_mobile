import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/app_info/app_info.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/confirm_dialog.dart';

/// About, logout, and admin re-provisioning (clear the stored device id).
/// Re-provisioning is shown only to users holding `DEVICE_MANAGE`.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    final provisioning = ref.watch(provisioningControllerProvider);
    final validation = ref.watch(deviceValidationControllerProvider);
    final config = ref.watch(appConfigProvider);
    final version = ref.watch(appVersionProvider).value ?? '-';
    final user = session is SignedIn ? session.user : null;
    final device = provisioning is Provisioned ? provisioning.device : null;
    final context_ = validation is ValidationPassed ? validation.context : null;
    final tokens = context.tokens;

    Future<void> logout() async {
      final ok = await showConfirmDialog(
        context,
        title: AppStrings.logoutConfirmTitle,
        body: AppStrings.logoutConfirmBody,
      );
      if (ok) await ref.read(sessionControllerProvider.notifier).logout();
    }

    Future<void> reprovision() async {
      final ok = await showConfirmDialog(
        context,
        title: AppStrings.reprovisionConfirmTitle,
        body: AppStrings.reprovisionConfirmBody,
      );
      if (ok) await ref.read(provisioningControllerProvider.notifier).reset();
    }

    Widget row(String label, String value) => ListTile(
      title: Text(label),
      subtitle: Text(value, style: Theme.of(context).textTheme.bodyLarge),
    );

    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.settingsTitle)),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: tokens.maxContentWidth),
            child: ListView(
              padding: EdgeInsets.all(tokens.spacingLg),
              children: [
                row(AppStrings.appVersion, version),
                row(AppStrings.environment, config.environment.name),
                row(AppStrings.user, user == null ? '-' : user.name),
                row(AppStrings.deviceCode, device?.deviceCode ?? '-'),
                row(AppStrings.deviceId, device?.deviceId ?? '-'),
                if (context_ != null) ...[
                  row(AppStrings.factory, context_.factory.name),
                  row(
                    AppStrings.trolley,
                    '${context_.trolley.code} · ${context_.trolley.name}',
                  ),
                ],
                SizedBox(height: tokens.spacingLg),
                SecondaryActionButton(
                  key: const Key('settings.logout'),
                  label: AppStrings.logout,
                  icon: Icons.logout,
                  onPressed: () => unawaited(logout()),
                ),
                SizedBox(height: tokens.spacingMd),
                if (user != null && user.canReprovisionDevice)
                  OutlinedButton.icon(
                    key: const Key('settings.reprovision'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: Size.fromHeight(tokens.buttonHeight),
                      foregroundColor: tokens.danger,
                      side: BorderSide(color: tokens.danger, width: 2),
                    ),
                    icon: const Icon(Icons.restart_alt),
                    label: const Text(AppStrings.reprovision),
                    onPressed: () => unawaited(reprovision()),
                  )
                else
                  Text(
                    AppStrings.reprovisionOnlyAdmin,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
