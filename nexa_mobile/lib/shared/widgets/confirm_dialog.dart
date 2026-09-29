import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

/// Confirmation before a destructive action (Doc 07 §44, Doc 17 §33).
/// Resolves to `true` only when the user confirms.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String body,
  String confirmLabel = AppStrings.confirm,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      icon: const Icon(Icons.warning_amber_rounded, size: 48),
      title: Text(title),
      content: Text(body),
      actions: [
        OutlinedButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text(AppStrings.cancel),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.error,
            foregroundColor: Theme.of(context).colorScheme.onError,
          ),
          onPressed: () => Navigator.of(context).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return confirmed ?? false;
}
