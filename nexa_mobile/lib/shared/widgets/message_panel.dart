import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';

/// A full-screen message: icon, title, short body, one primary action and an
/// optional secondary one (blocked device, access denied, generic error).
class MessagePanel extends StatelessWidget {
  const MessagePanel({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.body,
    this.primaryLabel,
    this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
    this.busy = false,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String body;
  final String? primaryLabel;
  final VoidCallback? onPrimary;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return Center(
      child: SingleChildScrollView(
        padding: EdgeInsets.all(tokens.spacingLg),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: tokens.maxContentWidth),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(icon, size: 72, color: iconColor),
              SizedBox(height: tokens.spacingMd),
              Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: iconColor,
                ),
              ),
              SizedBox(height: tokens.spacingMd),
              Text(
                body,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge,
              ),
              if (primaryLabel != null) ...[
                SizedBox(height: tokens.spacingXl),
                PrimaryActionButton(
                  label: primaryLabel!,
                  onPressed: onPrimary,
                  busy: busy,
                ),
              ],
              if (secondaryLabel != null) ...[
                SizedBox(height: tokens.spacingMd),
                SecondaryActionButton(
                  label: secondaryLabel!,
                  onPressed: busy ? null : onSecondary,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
