import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/message_panel.dart';

/// FR-MOB-002 "LOGIN BLOCKED" (INACTIVE / REVOKED), access denied, or
/// "never bootstrapped and offline". No transaction screen is reachable from
/// here (Doc 17 §41).
class DeviceBlockedScreen extends ConsumerStatefulWidget {
  const DeviceBlockedScreen({super.key});

  @override
  ConsumerState<DeviceBlockedScreen> createState() =>
      _DeviceBlockedScreenState();
}

class _DeviceBlockedScreenState extends ConsumerState<DeviceBlockedScreen> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    await action();
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final validation = ref.watch(deviceValidationControllerProvider);
    final session = ref.watch(sessionControllerProvider);
    final canReprovision =
        session is SignedIn && session.user.canReprovisionDevice;
    final tokens = context.tokens;

    final (icon, color, title, body, primary) = switch (validation) {
      ValidationBlocked(:final status) => (
        Icons.block,
        tokens.danger,
        AppStrings.blockedTitle,
        status == DeviceStatus.revoked
            ? AppStrings.blockedRevoked
            : AppStrings.blockedInactive,
        AppStrings.checkAgain,
      ),
      ValidationAccessDenied() => (
        Icons.lock_person,
        tokens.danger,
        AppStrings.accessDeniedTitle,
        AppStrings.accessDeniedBody,
        AppStrings.checkAgain,
      ),
      _ => (
        Icons.cloud_off,
        tokens.warning,
        AppStrings.unavailableTitle,
        AppStrings.unavailableBody,
        AppStrings.retry,
      ),
    };

    final validator = ref.read(deviceValidationControllerProvider.notifier);
    final sessionController = ref.read(sessionControllerProvider.notifier);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: MessagePanel(
                key: const Key('blocked.panel'),
                icon: icon,
                iconColor: color,
                title: title,
                body: body,
                busy: _busy,
                primaryLabel: primary,
                onPrimary: () => unawaited(_run(validator.validate)),
                secondaryLabel: AppStrings.logout,
                onSecondary: () => unawaited(_run(sessionController.logout)),
              ),
            ),
            if (canReprovision)
              Padding(
                padding: EdgeInsets.only(bottom: tokens.spacingLg),
                child: TextButton.icon(
                  onPressed: _busy ? null : () => context.push(Routes.settings),
                  icon: const Icon(Icons.settings),
                  label: const Text(AppStrings.reprovision),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
