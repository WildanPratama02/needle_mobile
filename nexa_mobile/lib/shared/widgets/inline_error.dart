import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// A short error line: icon + text + colour, never colour alone (Doc 17 §36).
class InlineError extends StatelessWidget {
  const InlineError({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Row(
      children: [
        Icon(Icons.error_outline, color: tokens.danger, size: tokens.iconSize),
        SizedBox(width: tokens.spacingSm),
        Expanded(
          child: Text(
            message,
            style: Theme.of(context).textTheme.bodyLarge
                ?.copyWith(color: tokens.danger),
          ),
        ),
      ],
    );
  }
}
