import 'package:flutter/material.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';

/// One wizard screen: the body, then a fixed footer with the cancel action on
/// the left and the screen's ONE primary action on the right (Doc 07 §43,
/// Doc 17 §8 footer "Batal … →"). The footer never scrolls away — the Galaxy
/// Tab A7 Lite gives about 550 dp of height in landscape.
class StepLayout extends StatelessWidget {
  const StepLayout({
    super.key,
    required this.body,
    this.title,
    this.primaryLabel,
    this.onPrimary,
    this.busy = false,
    this.secondaryLabel,
    this.onSecondary,
    this.onCancel,
    this.scrollable = true,
  });

  final String? title;
  final Widget body;
  final String? primaryLabel;
  final VoidCallback? onPrimary;
  final bool busy;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;

  /// `null` hides "BATALKAN" (terminal screens).
  final VoidCallback? onCancel;

  /// `false` for bodies that size themselves (camera preview).
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: scrollable ? MainAxisSize.min : MainAxisSize.max,
      children: [
        if (title != null) ...[
          Text(
            title!,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: tokens.spacingMd),
        ],
        if (scrollable) body else Expanded(child: body),
      ],
    );
    final hasFooter =
        onCancel != null || primaryLabel != null || secondaryLabel != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: scrollable
              ? SingleChildScrollView(
                  padding: EdgeInsets.all(tokens.spacingLg),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 960),
                      child: content,
                    ),
                  ),
                )
              : Padding(
                  padding: EdgeInsets.all(tokens.spacingMd),
                  child: content,
                ),
        ),
        if (hasFooter)
          Material(
            color: theme.colorScheme.surface,
            elevation: 4,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: tokens.spacingLg,
                  vertical: tokens.spacingSm,
                ),
                child: Row(
                  children: [
                    if (onCancel != null)
                      TextButton.icon(
                        key: const Key('exchange.cancel'),
                        onPressed: busy ? null : onCancel,
                        style: TextButton.styleFrom(
                          foregroundColor: tokens.danger,
                        ),
                        icon: const Icon(Icons.close),
                        label: const Text(AppStrings.cancelExchange),
                      ),
                    const Spacer(),
                    if (secondaryLabel != null) ...[
                      SizedBox(
                        width: 220,
                        child: SecondaryActionButton(
                          key: const Key('exchange.secondary'),
                          label: secondaryLabel!,
                          onPressed: busy ? null : onSecondary,
                        ),
                      ),
                      SizedBox(width: tokens.spacingMd),
                    ],
                    if (primaryLabel != null)
                      ConstrainedBox(
                        constraints: const BoxConstraints(
                          minWidth: 280,
                          maxWidth: 420,
                        ),
                        child: PrimaryActionButton(
                          key: const Key('exchange.primary'),
                          label: primaryLabel!,
                          onPressed: onPrimary,
                          busy: busy,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
