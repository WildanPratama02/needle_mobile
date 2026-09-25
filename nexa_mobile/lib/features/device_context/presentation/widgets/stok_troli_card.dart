import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/inventory_stock/presentation/widgets/stock_status_badge.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';

/// "STOK TROLI SAAT INI" (FR-MOB-015) — current trolley stock, one row per
/// needle type, from `GET /inventory/trolleys/{trolleyId}` (contract matrix:
/// READY). Tapping the card opens the full trolley-stock view
/// (`Routes.trolleyStock`).
///
/// Read-only display. Per ADR-004 / `nexa_mobile/CLAUDE.md` §1, these
/// numbers are a UI hint, never a client-computed balance and never used to
/// allow/deny an exchange locally.
class StokTroliCard extends ConsumerWidget {
  const StokTroliCard({super.key, required this.trolleyId});

  final String trolleyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textTheme = Theme.of(context).textTheme;
    final tokens = context.tokens;
    final stock = ref.watch(trolleyStockProvider(trolleyId));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        key: const Key('home.trolleyStock'),
        onTap: () => context.push(Routes.trolleyStock),
        borderRadius: BorderRadius.circular(20),
        child: AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(AppStrings.homeStockTitle, style: textTheme.titleMedium),
              SizedBox(height: tokens.spacingMd),
              Expanded(child: _Body(stock: stock)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.stock});

  final AsyncValue<TrolleyStockOutcome> stock;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return stock.when(
      loading: () =>
          const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      error: (error, stackTrace) =>
          Text(AppStrings.homeStockUnavailable, style: textTheme.bodySmall),
      data: (outcome) => switch (outcome) {
        TrolleyStockFailed() => Text(
          AppStrings.homeStockUnavailable,
          style: textTheme.bodySmall,
        ),
        TrolleyStockLoaded(:final items) when items.isEmpty => Text(
          AppStrings.homeStockEmpty,
          style: textTheme.bodySmall,
        ),
        TrolleyStockLoaded(:final items) => ListView.separated(
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final item = items[index];
            return Row(
              children: [
                Flexible(
                  child: Text(
                    item.displayName,
                    style: textTheme.bodyMedium,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                StockStatusBadge(status: item.status),
                const Spacer(),
                Text(
                  '${item.quantity}',
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            );
          },
        ),
      },
    );
  }
}
