import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// The one primary action of a screen (Doc 07 §43, Doc 17 §33): large filled
/// button. [dominant] makes it the oversized Home-style action.
class PrimaryActionButton extends StatelessWidget {
  const PrimaryActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.dominant = false,
    this.busy = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool dominant;

  /// Shows a spinner and disables the button while a request runs.
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final height = dominant ? tokens.primaryActionHeight : tokens.buttonHeight;
    final textStyle = Theme.of(context).textTheme.labelLarge
        ?.copyWith(fontSize: dominant ? 30 : null);
    final child = busy
        ? SizedBox.square(
            dimension: tokens.iconSize,
            child: const CircularProgressIndicator(strokeWidth: 3),
          )
        : Text(label, textAlign: TextAlign.center);
    final style = FilledButton.styleFrom(
      minimumSize: Size.fromHeight(height),
      textStyle: textStyle,
    );
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: busy,
      child: icon == null || busy
          ? FilledButton(
              onPressed: busy ? null : onPressed,
              style: style,
              child: child,
            )
          : FilledButton.icon(
              onPressed: onPressed,
              style: style,
              icon: Icon(icon, size: dominant ? 40 : tokens.iconSize),
              label: child,
            ),
    );
  }
}

/// Secondary action (Doc 17 §33: KEMBALI, ULANGI, BATAL, …).
class SecondaryActionButton extends StatelessWidget {
  const SecondaryActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final style = OutlinedButton.styleFrom(
      minimumSize: Size.fromHeight(tokens.buttonHeight),
    );
    return icon == null
        ? OutlinedButton(
            onPressed: onPressed,
            style: style,
            child: Text(label, textAlign: TextAlign.center),
          )
        : OutlinedButton.icon(
            onPressed: onPressed,
            style: style,
            icon: Icon(icon, size: tokens.iconSize),
            label: Text(label, textAlign: TextAlign.center),
          );
  }
}
