import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_state.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Doc 17 §44 progress: current stage highlighted, the fragment stage only
/// for BROKEN.
class ExchangeProgressBar extends StatelessWidget {
  const ExchangeProgressBar({
    super.key,
    required this.step,
    required this.broken,
  });

  final ExchangeFlowStep step;
  final bool broken;

  static String _label(ExchangeProgressStage stage) => switch (stage) {
    ExchangeProgressStage.operator => AppStrings.stageOperator,
    ExchangeProgressStage.oldNeedle => AppStrings.stageOldNeedle,
    ExchangeProgressStage.exchangeType => AppStrings.stageExchangeType,
    ExchangeProgressStage.fragment => AppStrings.stageFragment,
    ExchangeProgressStage.photo => AppStrings.stagePhoto,
    ExchangeProgressStage.newNeedle => AppStrings.stageNewNeedle,
    ExchangeProgressStage.issue => AppStrings.stageIssue,
    ExchangeProgressStage.store => AppStrings.stageStore,
  };

  @override
  Widget build(BuildContext context) {
    final current = ExchangeStepMapper.stageOf(step);
    if (current == null) return const SizedBox.shrink();
    final stages = ExchangeStepMapper.stagesFor(broken: broken);
    final index = stages.indexOf(current);
    final theme = Theme.of(context);
    final tokens = context.tokens;
    return Container(
      color: theme.colorScheme.surfaceContainerLow,
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingLg,
        vertical: tokens.spacingSm,
      ),
      child: Row(
        children: [
          for (final (i, stage) in stages.indexed)
            Expanded(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 13,
                    backgroundColor: i < index
                        ? tokens.success
                        : i == index
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outlineVariant,
                    child: i < index
                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                        : Text(
                            '${i + 1}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      _label(stage),
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: i == index
                            ? FontWeight.w800
                            : FontWeight.w500,
                        color: i == index ? theme.colorScheme.primary : null,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Notice banner: icon + title + text, never colour alone (Doc 17 §36).
class FlowNoticeBanner extends StatelessWidget {
  const FlowNoticeBanner({super.key, required this.notice, this.onRetry});

  final FlowNotice notice;

  /// Shown as "COBA LAGI" for a transient failure (same attempt, same key).
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final (color, icon) = switch (notice.kind) {
      FlowNoticeKind.info => (theme.colorScheme.primary, Icons.info_outline),
      FlowNoticeKind.success => (tokens.success, Icons.check_circle_outline),
      FlowNoticeKind.warning => (tokens.warning, Icons.warning_amber_rounded),
      FlowNoticeKind.error => (tokens.danger, Icons.error_outline),
    };
    return Container(
      key: const Key('exchange.notice'),
      margin: EdgeInsets.fromLTRB(
        tokens.spacingLg,
        tokens.spacingSm,
        tokens.spacingLg,
        0,
      ),
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingMd,
        vertical: tokens.spacingSm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(tokens.radius),
        border: Border.all(color: color, width: 2),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: tokens.iconSize),
          SizedBox(width: tokens.spacingSm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (notice.title != null)
                  Text(
                    notice.title!,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                Text(
                  notice.text,
                  style: theme.textTheme.bodyMedium?.copyWith(color: color),
                ),
              ],
            ),
          ),
          if (onRetry != null) ...[
            SizedBox(width: tokens.spacingSm),
            OutlinedButton.icon(
              key: const Key('exchange.retry'),
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text(AppStrings.retry),
            ),
          ],
        ],
      ),
    );
  }
}

/// A large tappable card: exchange type, fragment answer (Doc 07 §43,
/// Doc 17 §11/§14 "use large cards/buttons").
class ChoiceCard extends StatelessWidget {
  const ChoiceCard({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.color,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = context.tokens;
    final accent = color ?? theme.colorScheme.primary;
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(20),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          constraints: const BoxConstraints(minHeight: 140),
          padding: EdgeInsets.all(tokens.spacingMd),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: accent, width: 3),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 44, color: accent),
              SizedBox(height: tokens.spacingSm),
              Text(
                label,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: accent,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Label / value rows for the confirmation and summary screens
/// (Doc 17 §24, §26).
class SummaryTable extends StatelessWidget {
  const SummaryTable({super.key, required this.rows});

  final List<(String, String)> rows;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = context.tokens;
    return Container(
      padding: EdgeInsets.all(tokens.spacingMd),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(tokens.radius),
      ),
      child: Column(
        children: [
          for (final (label, value) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 200,
                    child: Text(label, style: theme.textTheme.bodyLarge),
                  ),
                  Expanded(
                    child: Text(
                      value,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// A large centred status block (found operator, waiting, done…).
class StatusBlock extends StatelessWidget {
  const StatusBlock({
    super.key,
    required this.icon,
    required this.color,
    required this.title,
    this.body,
    this.child,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String? body;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = context.tokens;
    return Column(
      children: [
        Icon(icon, size: 64, color: color),
        SizedBox(height: tokens.spacingSm),
        Text(
          title,
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineSmall?.copyWith(
            color: color,
            fontWeight: FontWeight.w800,
          ),
        ),
        if (body != null) ...[
          SizedBox(height: tokens.spacingSm),
          Text(
            body!,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyLarge,
          ),
        ],
        if (child != null) ...[SizedBox(height: tokens.spacingMd), child!],
      ],
    );
  }
}
