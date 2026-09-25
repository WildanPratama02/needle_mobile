import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

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
      TrolleyStockStatus.normal || TrolleyStockStatus.unknown => ('', tokens.neutral),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: color, fontSize: 10),
      ),
    );
  }
}
