import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_view.dart';
import 'package:nexa_mobile/features/inventory_stock/presentation/trolley_stock_controller.dart';
import 'package:nexa_mobile/features/inventory_stock/presentation/widgets/stock_status_badge.dart';
import 'package:nexa_mobile/shared/format/date_time_format.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';
import 'package:nexa_mobile/shared/widgets/screen_title_bar.dart';

/// Trolley stock (FR-MOB-015, Doc 07 §31): this device's trolley, one row
/// per needle type — name + code, quantity, minimum stock, status — out and
/// low first. Read-only: the tablet never edits stock (ADR-004). Offline it
/// shows the last kept copy, marked stale with its time. Pull to refresh.
class TrolleyStockScreen extends ConsumerWidget {
  const TrolleyStockScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final validation = ref.watch(deviceValidationControllerProvider);
    if (validation is! ValidationPassed) return const SizedBox.shrink();
    final trolley = validation.context.trolley;
    final tokens = context.tokens;
    final connectivity = ref.watch(connectivityStatusProvider).value;
    final provider = trolleyStockControllerProvider(trolley.id);
    final stock = ref.watch(provider);
    Future<void> refresh() => ref.read(provider.notifier).refresh();

    final Widget body = switch (stock) {
      AsyncValue(value: TrolleyStockShown(:final view)) => _StockList(
        view: view,
        offline: connectivity == ConnectivityStatus.offline,
      ),
      AsyncValue(
        value: TrolleyStockUnavailable(:final offline, :final error),
      ) =>
        _Unavailable(
          message: offline
              ? AppStrings.stockNoCacheOffline
              : '${AppStrings.stockLoadFailed} '
                    '${error?.userMessage ?? ''}',
          onRetry: () => unawaited(refresh()),
        ),
      AsyncError() => _Unavailable(
        message: AppStrings.stockLoadFailed,
        onRetry: () => unawaited(refresh()),
      ),
      _ => const Center(
        key: Key('stock.loading'),
        child: CircularProgressIndicator(),
      ),
    };

    return Scaffold(
      backgroundColor: tokens.pageBackground,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ScreenTitleBar(
            title: AppStrings.stockScreenTitle,
            subtitle: '${trolley.name} · ${trolley.code}',
            connectivity: connectivity,
            backKey: const Key('stock.back'),
          ),
          Expanded(
            child: RefreshIndicator(
              key: const Key('stock.refresh'),
              onRefresh: refresh,
              child: body,
            ),
          ),
        ],
      ),
    );
  }
}

class _StockList extends StatelessWidget {
  const _StockList({required this.view, required this.offline});

  final TrolleyStockView view;
  final bool offline;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final items = view.items;
    return ListView(
      key: const Key('stock.list'),
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.all(tokens.spacingLg),
      children: [
        if (view.stale)
          _StaleBanner(view: view, offline: offline)
        else
          Text(
            '${AppStrings.stockUpdatedAt} ${formatDateTime(view.fetchedAt)}',
            key: const Key('stock.updatedAt'),
            style: theme.textTheme.titleMedium,
          ),
        SizedBox(height: tokens.spacingXs),
        Text(AppStrings.stockReadOnlyNote, style: theme.textTheme.bodyMedium),
        SizedBox(height: tokens.spacingMd),
        AppCard(
          padding: EdgeInsets.zero,
          child: items.isEmpty
              ? Padding(
                  padding: EdgeInsets.all(tokens.spacingLg),
                  child: Text(
                    AppStrings.stockScreenEmpty,
                    key: const Key('stock.empty'),
                    style: theme.textTheme.titleMedium,
                  ),
                )
              : Column(
                  children: [
                    const _HeaderRow(),
                    for (final (i, item) in items.indexed) ...[
                      if (i > 0) const Divider(height: 1),
                      _StockRow(item: item),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}

class _StaleBanner extends StatelessWidget {
  const _StaleBanner({required this.view, required this.offline});

  final TrolleyStockView view;
  final bool offline;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return Container(
      key: const Key('stock.stale'),
      padding: EdgeInsets.all(tokens.spacingMd),
      decoration: BoxDecoration(
        color: tokens.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(tokens.radius),
        border: Border.all(color: tokens.warning, width: 2),
      ),
      child: Row(
        children: [
          Icon(Icons.history, color: tokens.warning, size: tokens.iconSize),
          SizedBox(width: tokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  offline || view.error == null
                      ? AppStrings.stockStaleOffline
                      : AppStrings.stockStaleFailed,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: tokens.warning,
                  ),
                ),
                Text(
                  '${AppStrings.stockSavedAt}: '
                  '${formatDateTime(view.fetchedAt)}',
                  key: const Key('stock.savedAt'),
                  style: theme.textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Column widths shared by the header and the rows.
const _flexNeedle = 5;
const _flexQuantity = 2;
const _flexMinimum = 2;
const _flexStatus = 3;

class _HeaderRow extends StatelessWidget {
  const _HeaderRow();

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final style = Theme.of(context).textTheme.labelLarge;
    Widget cell(String text, int flex, {TextAlign align = TextAlign.start}) =>
        Expanded(
          flex: flex,
          child: Text(text, style: style, textAlign: align),
        );
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingLg,
        vertical: tokens.spacingMd,
      ),
      child: Row(
        children: [
          cell(AppStrings.stockColumnNeedle, _flexNeedle),
          cell(
            AppStrings.stockColumnQuantity,
            _flexQuantity,
            align: TextAlign.end,
          ),
          cell(
            AppStrings.stockColumnMinimum,
            _flexMinimum,
            align: TextAlign.end,
          ),
          SizedBox(width: tokens.spacingLg),
          cell(AppStrings.stockColumnStatus, _flexStatus),
        ],
      ),
    );
  }
}

class _StockRow extends StatelessWidget {
  const _StockRow({required this.item});

  final TrolleyStockItem item;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return ConstrainedBox(
      key: Key('stock.row.${item.needleTypeId}'),
      constraints: BoxConstraints(minHeight: tokens.buttonHeight + 8),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: tokens.spacingLg,
          vertical: tokens.spacingSm,
        ),
        child: Row(
          children: [
            Expanded(
              flex: _flexNeedle,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.displayName,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (item.displayName != item.needleTypeCode)
                    Text(
                      item.needleTypeCode,
                      style: theme.textTheme.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            Expanded(
              flex: _flexQuantity,
              child: Text(
                '${item.quantity}',
                textAlign: TextAlign.end,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            Expanded(
              flex: _flexMinimum,
              child: Text(
                '${item.minimumStock}',
                textAlign: TextAlign.end,
                style: theme.textTheme.titleMedium,
              ),
            ),
            SizedBox(width: tokens.spacingLg),
            Expanded(
              flex: _flexStatus,
              child: Align(
                alignment: Alignment.centerLeft,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: TrolleyStockStatusBadge(
                    key: Key('stock.status.${item.needleTypeId}'),
                    status: item.status,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Unavailable extends StatelessWidget {
  const _Unavailable({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.all(tokens.spacingXl),
      children: [
        Icon(Icons.cloud_off, size: 72, color: tokens.neutral),
        SizedBox(height: tokens.spacingMd),
        Text(
          message.trim(),
          key: const Key('stock.unavailable'),
          textAlign: TextAlign.center,
          style: theme.textTheme.titleMedium,
        ),
        SizedBox(height: tokens.spacingLg),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 360),
            child: SecondaryActionButton(
              key: const Key('stock.retry'),
              label: AppStrings.retry,
              icon: Icons.refresh,
              onPressed: onRetry,
            ),
          ),
        ),
      ],
    );
  }
}
