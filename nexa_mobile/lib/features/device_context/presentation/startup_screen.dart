import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Splash while secure storage is read, and while the device is validated
/// right after login (Doc 17 §43, §62 "01 Splash").
class StartupScreen extends ConsumerWidget {
  const StartupScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final validating =
        ref.watch(deviceValidationControllerProvider) is ValidationChecking;
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              AppStrings.appName,
              style: theme.textTheme.displaySmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: theme.colorScheme.primary,
              ),
            ),
            SizedBox(height: tokens.spacingXl),
            const SizedBox.square(
              dimension: 56,
              child: CircularProgressIndicator(strokeWidth: 5),
            ),
            SizedBox(height: tokens.spacingLg),
            Text(
              validating
                  ? AppStrings.startupValidating
                  : AppStrings.startupChecking,
              style: theme.textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
