import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/clock/server_clock.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_state_label.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/features/history/presentation/history_controller.dart';
import 'package:nexa_mobile/features/history/presentation/widgets/history_filter_bar.dart';
import 'package:nexa_mobile/features/history/presentation/widgets/history_labels.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/format/date_time_format.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';
import 'package:nexa_mobile/shared/widgets/screen_title_bar.dart';

/// Transaction history (FR-MOB-014, Doc 07 §30, Doc 17 §27): this device's
/// exchanges — date, time, operator, old needle, exchange type, new needle,
/// server status and local sync status — with the FR-MOB-014 filters,
/// infinite scroll and pull-to-refresh. Exchanges still on the tablet (not
/// or not fully synced) are merged in with their sync badge; offline only
/// the tablet's saved exchanges are shown, and the screen says so. Tapping a
/// row opens the read-only detail. One purpose: look back; no primary action.
class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final validation = ref.watch(deviceValidationControllerProvider);
    if (validation is! ValidationPassed) return const SizedBox.shrink();
    final tokens = context.tokens;
    final connectivity = ref.watch(connectivityStatusProvider).value;
    final history = ref.watch(historyControllerProvider);
    final controller = ref.read(historyControllerProvider.notifier);
    final entries = ref.watch(historyEntriesProvider);
    final catalog =
        ref.watch(historyCatalogProvider).value ?? const HistoryCatalog();
    final trolley = validation.context.trolley;
    final today = DateTime.now().add(ref.watch(serverClockProvider));

    return Scaffold(
      backgroundColor: tokens.pageBackground,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ScreenTitleBar(
            title: AppStrings.historyScreenTitle,
            subtitle: '${trolley.name} · ${validation.context.device.code}',
            connectivity: connectivity,
            backKey: const Key('history.back'),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              tokens.spacingLg,
              tokens.spacingMd,
              tokens.spacingLg,
              tokens.spacingSm,
            ),
            child: HistoryFilterBar(
              filter: history.filter,
              catalog: catalog,
              today: today,
              onChanged: controller.setFilter,
            ),
          ),
          if (history.source != HistorySource.server)
            Padding(
              padding: EdgeInsets.symmetric(horizontal: tokens.spacingLg),
              child: _SourceBanner(
                state: history,
                onRetry: () => unawaited(controller.refresh()),
              ),
            ),
          SizedBox(
            height: 4,
            child: history.loading
                ? const LinearProgressIndicator(key: Key('history.loading'))
                : null,
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                tokens.spacingLg,
                tokens.spacingSm,
                tokens.spacingLg,
                tokens.spacingLg,
              ),
              child: AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _HeaderRow(),
                    const Divider(height: 1),
                    Expanded(
                      child: RefreshIndicator(
                        key: const Key('history.refresh'),
                        onRefresh: controller.refresh,
                        child: _Rows(
                          entries: entries,
                          state: history,
                          catalog: catalog,
                          onLoadMore: () => unawaited(controller.loadMore()),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SourceBanner extends StatelessWidget {
  const _SourceBanner({required this.state, required this.onRetry});

  final HistoryState state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final (key, icon, color, text) = switch (state.source) {
      HistorySource.offline => (
        'offline',
        Icons.cloud_off,
        tokens.neutral,
        AppStrings.historyOffline,
      ),
      HistorySource.unreachable => (
        'unreachable',
        Icons.cloud_off,
        tokens.warning,
        AppStrings.historyServerUnreachable,
      ),
      _ => (
        'failed',
        Icons.error_outline,
        tokens.danger,
        '${AppStrings.historyLoadFailed} '
            '${state.error?.userMessage ?? ''}',
      ),
    };
    return Container(
      key: Key('history.banner.$key'),
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingMd,
        vertical: tokens.spacingSm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(tokens.radius),
        border: Border.all(color: color, width: 2),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: tokens.iconSize),
          SizedBox(width: tokens.spacingMd),
          Expanded(
            child: Text(
              text.trim(),
              style: theme.textTheme.titleMedium?.copyWith(color: color),
            ),
          ),
          if (state.source != HistorySource.offline)
            TextButton.icon(
              key: const Key('history.retry'),
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text(AppStrings.retry),
            ),
        ],
      ),
    );
  }
}

/// Column flexes shared by the header and the rows (1280 dp landscape).
const _flexDate = 4;
const _flexTime = 2;
const _flexOperator = 4;
const _flexOldNeedle = 4;
const _flexType = 4;
const _flexNewNeedle = 4;
const _flexStatus = 4;
const _flexSync = 4;

class _HeaderRow extends StatelessWidget {
  const _HeaderRow();

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final style = Theme.of(context).textTheme.labelLarge;
    Widget cell(String text, int flex) => Expanded(
      flex: flex,
      child: Text(text, style: style, overflow: TextOverflow.ellipsis),
    );
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingMd,
        vertical: tokens.spacingMd,
      ),
      child: Row(
        children: [
          cell(AppStrings.historyColumnDate, _flexDate),
          cell(AppStrings.historyColumnTime, _flexTime),
          cell(AppStrings.historyColumnOperator, _flexOperator),
          cell(AppStrings.historyColumnOldNeedle, _flexOldNeedle),
          cell(AppStrings.historyColumnExchangeType, _flexType),
          cell(AppStrings.historyColumnNewNeedle, _flexNewNeedle),
          cell(AppStrings.historyColumnStatus, _flexStatus),
          cell(AppStrings.historyColumnSync, _flexSync),
        ],
      ),
    );
  }
}

class _Rows extends StatelessWidget {
  const _Rows({
    required this.entries,
    required this.state,
    required this.catalog,
    required this.onLoadMore,
  });

  final List<HistoryEntry> entries;
  final HistoryState state;
  final HistoryCatalog catalog;
  final VoidCallback onLoadMore;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    if (entries.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(tokens.spacingXl),
        children: [
          if (!state.loading)
            Text(
              AppStrings.historyEmpty,
              key: const Key('history.empty'),
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium,
            ),
        ],
      );
    }
    final footer = state.loadingMore || state.loadMoreError != null ? 1 : 0;
    return ListView.separated(
      key: const Key('history.list'),
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: entries.length + footer,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (context, i) {
        if (i >= entries.length) {
          return _Footer(state: state, onLoadMore: onLoadMore);
        }
        // Infinite scroll: ask for the next page as the end comes into view
        // (after this frame — never while building).
        if (i >= entries.length - 5 &&
            state.hasMore &&
            !state.loadingMore &&
            state.loadMoreError == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) => onLoadMore());
        }
        return _HistoryRow(entry: entries[i], catalog: catalog);
      },
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.state, required this.onLoadMore});

  final HistoryState state;
  final VoidCallback onLoadMore;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Padding(
      padding: EdgeInsets.all(tokens.spacingMd),
      child: state.loadingMore
          ? const Center(
              key: Key('history.loadingMore'),
              child: CircularProgressIndicator(),
            )
          : Row(
              children: [
                Expanded(
                  child: Text(
                    AppStrings.historyLoadMoreFailed,
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(color: tokens.danger),
                  ),
                ),
                SizedBox(
                  width: 240,
                  child: SecondaryActionButton(
                    key: const Key('history.loadMore'),
                    label: AppStrings.historyLoadMore,
                    icon: Icons.refresh,
                    onPressed: onLoadMore,
                  ),
                ),
              ],
            ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  const _HistoryRow({required this.entry, required this.catalog});

  final HistoryEntry entry;
  final HistoryCatalog catalog;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final operator = operatorLabel(entry);
    final oldNeedle = needleLabel(catalog, entry.oldNeedleTypeId);
    final newNeedle = needleLabel(catalog, entry.newNeedleTypeId);

    Widget twoLine(({String title, String? subtitle}) value, int flex) =>
        Expanded(
          flex: flex,
          child: Padding(
            padding: EdgeInsets.only(right: tokens.spacingSm),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value.title,
                  style: theme.textTheme.titleSmall,
                  overflow: TextOverflow.ellipsis,
                ),
                if (value.subtitle != null)
                  Text(
                    value.subtitle!,
                    style: theme.textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
        );

    return InkWell(
      key: Key('history.row.${entry.key}'),
      onTap: () => context.push(Routes.historyDetail, extra: entry),
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: tokens.buttonHeight + 8),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacingMd,
            vertical: tokens.spacingSm,
          ),
          child: Row(
            children: [
              twoLine((
                title: formatDate(entry.createdAt),
                subtitle: entry.exchangeNumber,
              ), _flexDate),
              twoLine((
                title: formatTime(entry.createdAt),
                subtitle: null,
              ), _flexTime),
              twoLine(operator, _flexOperator),
              twoLine(oldNeedle, _flexOldNeedle),
              twoLine((
                title: exchangeTypeLabel(catalog, entry),
                subtitle: null,
              ), _flexType),
              twoLine(newNeedle, _flexNewNeedle),
              Expanded(
                flex: _flexStatus,
                child: Padding(
                  padding: EdgeInsets.only(right: tokens.spacingSm),
                  child: ExchangeStateText(state: entry.state),
                ),
              ),
              Expanded(
                flex: _flexSync,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: LocalSyncStateBadge(state: entry.syncState),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
