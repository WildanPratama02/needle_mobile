import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Cancel confirmation with a mandatory reason (Doc 07 §29, §44). Preset
/// reasons keep typing minimal (Doc 07 §42.1). Resolves to the reason, or
/// `null` when the PIC keeps the exchange.
Future<String?> showCancelExchangeDialog(
  BuildContext context, {
  required bool stockIssued,
  String? initialReason,
}) => showDialog<String>(
  context: context,
  builder: (context) =>
      _CancelDialog(stockIssued: stockIssued, initialReason: initialReason),
);

class _CancelDialog extends StatefulWidget {
  const _CancelDialog({required this.stockIssued, this.initialReason});

  final bool stockIssued;
  final String? initialReason;

  @override
  State<_CancelDialog> createState() => _CancelDialogState();
}

class _CancelDialogState extends State<_CancelDialog> {
  late final _reason = TextEditingController(text: widget.initialReason);

  @override
  void initState() {
    super.initState();
    _reason.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final valid = _reason.text.trim().isNotEmpty;
    return AlertDialog(
      icon: Icon(Icons.warning_amber_rounded, size: 48, color: tokens.danger),
      title: const Text(AppStrings.cancelExchangeTitle),
      scrollable: true,
      content: SizedBox(
        width: 560,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(AppStrings.cancelExchangeBody),
            if (widget.stockIssued) ...[
              SizedBox(height: tokens.spacingSm),
              Text(
                AppStrings.cancelExchangeAfterIssue,
                style: TextStyle(
                  color: tokens.warning,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
            SizedBox(height: tokens.spacingMd),
            Wrap(
              spacing: tokens.spacingSm,
              runSpacing: tokens.spacingSm,
              children: [
                for (final (i, preset)
                    in AppStrings.cancelReasonPresets.indexed)
                  ChoiceChip(
                    key: Key('cancel.preset.$i'),
                    label: Text(preset),
                    selected: _reason.text == preset,
                    onSelected: (_) => _reason.text = preset,
                  ),
              ],
            ),
            SizedBox(height: tokens.spacingMd),
            TextField(
              key: const Key('cancel.reason'),
              controller: _reason,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: AppStrings.cancelReasonLabel,
              ),
            ),
          ],
        ),
      ),
      actions: [
        OutlinedButton(
          key: const Key('cancel.keep'),
          onPressed: () => Navigator.of(context).pop(),
          child: const Text(AppStrings.keepExchange),
        ),
        FilledButton(
          key: const Key('cancel.confirm'),
          style: FilledButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.error,
            foregroundColor: Theme.of(context).colorScheme.onError,
          ),
          onPressed: valid
              ? () => Navigator.of(context).pop(_reason.text.trim())
              : null,
          child: const Text(AppStrings.cancelConfirm),
        ),
      ],
    );
  }
}

enum LeaveChoice { stay, keep, cancel }

/// Doc 17 §45 transaction guard: LANJUTKAN / SIMPAN DRAFT / BATALKAN. The
/// exchange lives on the server, so "keep" just leaves; TUKAR JARUM resumes.
Future<LeaveChoice> showLeaveExchangeDialog(BuildContext context) async {
  final choice = await showDialog<LeaveChoice>(
    context: context,
    builder: (context) => AlertDialog(
      icon: const Icon(Icons.help_outline, size: 48),
      title: const Text(AppStrings.leaveTitle),
      content: const Text(AppStrings.leaveBody),
      actions: [
        TextButton(
          key: const Key('leave.cancel'),
          onPressed: () => Navigator.of(context).pop(LeaveChoice.cancel),
          child: const Text(AppStrings.leaveCancel),
        ),
        OutlinedButton(
          key: const Key('leave.keep'),
          onPressed: () => Navigator.of(context).pop(LeaveChoice.keep),
          child: const Text(AppStrings.leaveKeep),
        ),
        FilledButton(
          key: const Key('leave.stay'),
          onPressed: () => Navigator.of(context).pop(LeaveChoice.stay),
          child: const Text(AppStrings.leaveStay),
        ),
      ],
    ),
  );
  return choice ?? LeaveChoice.stay;
}
