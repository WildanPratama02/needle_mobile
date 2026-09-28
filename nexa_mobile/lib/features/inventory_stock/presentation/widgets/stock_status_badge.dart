import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/status_badge.dart';

/// Inline badge shown next to a low/critical trolley stock row (`MENIPIS` /
/// `KRITIS` in the reference design). Renders nothing for
/// [TrolleyStockStatus.normal] — a badge is only shown when it's actionable.
class StockStatusBadge extends StatelessWidget {
  const StockStatusBadge({super.key, required this.status});

  final TrolleyStockStatus status;

  @override
  Widget build(BuildContext context) {
    if (status == TrolleyStockStatus.normal ||
        status == TrolleyStockStatus.unknown) {
      return const SizedBox.shrink();
    }

    final tokens = context.tokens;
    final (label, color) = switch (status) {
      TrolleyStockStatus.low => ('MENIPIS', tokens.warning),
      TrolleyStockStatus.critical => ('KRITIS', tokens.danger),
      TrolleyStockStatus.normal ||
      TrolleyStockStatus.unknown => ('', tokens.neutral),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall
            ?.copyWith(color: color, fontSize: 10),
      ),
    );
  }
}

/// The stock screen's status label (contract matrix "Stock status labels",
/// MG-9): `NORMAL` → Available, `LOW` → Low stock, `OUT` → Out of stock — in
/// Indonesian like the rest of the UI.
String trolleyStockStatusLabel(TrolleyStockStatus status) => switch (status) {
  TrolleyStockStatus.normal => AppStrings.stockStatusAvailable,
  TrolleyStockStatus.low => AppStrings.stockStatusLow,
  TrolleyStockStatus.critical => AppStrings.stockStatusOut,
  TrolleyStockStatus.unknown => AppStrings.stockStatusUnknown,
};

/// Full status badge of the stock screen: icon + label + colour, for every
/// status (Doc 17 §36 — never colour alone).
class TrolleyStockStatusBadge extends StatelessWidget {
  const TrolleyStockStatusBadge({super.key, required this.status});

  final TrolleyStockStatus status;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final (icon, color) = switch (status) {
      TrolleyStockStatus.normal => (Icons.check_circle, tokens.success),
      TrolleyStockStatus.low => (Icons.warning_amber, tokens.warning),
      TrolleyStockStatus.critical => (Icons.error, tokens.danger),
      TrolleyStockStatus.unknown => (Icons.help_outline, tokens.neutral),
    };
    return StatusBadge(
      icon: icon,
      label: trolleyStockStatusLabel(status),
      color: color,
    );
  }
}
