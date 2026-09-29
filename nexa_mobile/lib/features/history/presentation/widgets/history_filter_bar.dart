import 'dart:async';

import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_state_label.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/shared/format/date_time_format.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// The FR-MOB-014 filters: Today / date range, status, exchange type, needle
/// type (+ old/new needle). Every control is a large touch target.
class HistoryFilterBar extends StatelessWidget {
  const HistoryFilterBar({
    super.key,
    required this.filter,
    required this.catalog,
    required this.today,
    required this.onChanged,
  });

  final HistoryFilter filter;
  final HistoryCatalog catalog;

  /// The tablet's "today" (server-clock corrected), bounding the picker.
  final DateTime today;
  final ValueChanged<HistoryFilter> onChanged;

  /// Every state a PIC can meet; `NEEDLE_SELECTED` is transient on the
  /// backend and never observed, so it is not offered.
  static final _states = [
    for (final s in ExchangeState.values)
      if (s != ExchangeState.needleSelected) s,
  ];

  Future<void> _pickRange(BuildContext context) async {
    final last = DateTime(today.year, today.month, today.day);
    final current = filter.range;
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(last.year - 1, last.month, last.day),
      lastDate: last,
      currentDate: last,
      initialDateRange: current == null
          ? DateTimeRange(
              start: last.subtract(const Duration(days: 6)),
              end: last,
            )
          : DateTimeRange(start: current.start, end: current.end),
    );
    if (picked == null) return;
    onChanged(
      filter.copyWith(
        range: HistoryDateRange(start: picked.start, end: picked.end),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final range = filter.range;
    return Wrap(
      spacing: tokens.spacingMd,
      runSpacing: tokens.spacingSm,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        _Chip(
          key: const Key('history.filter.today'),
          label: AppStrings.historyFilterToday,
          selected: range == null,
          onTap: () => onChanged(filter.copyWith(today: true)),
        ),
        _Chip(
          key: const Key('history.filter.range'),
          label: range == null
              ? AppStrings.historyFilterRange
              : '${formatShortDate(range.start)} – ${formatDate(range.end)}',
          icon: Icons.date_range,
          selected: range != null,
          onTap: () => unawaited(_pickRange(context)),
        ),
        _Dropdown<ExchangeState>(
          key: const Key('history.filter.status'),
          label: AppStrings.historyFilterStatus,
          value: filter.status,
          items: [
            for (final s in _states)
              (value: s, label: exchangeStateLabel(s), key: 'status.${s.wire}'),
          ],
          onChanged: (s) => onChanged(
            s == null
                ? filter.copyWith(anyStatus: true)
                : filter.copyWith(status: s),
          ),
        ),
        _Dropdown<String>(
          key: const Key('history.filter.exchangeType'),
          label: AppStrings.historyFilterExchangeType,
          value: filter.exchangeTypeId,
          items: [
            for (final t in catalog.exchangeTypes)
              (value: t.id, label: t.name, key: 'exchangeType.${t.code}'),
          ],
          onChanged: (id) => onChanged(
            id == null
                ? filter.copyWith(anyExchangeType: true)
                : filter.copyWith(exchangeTypeId: id),
          ),
        ),
        _Dropdown<String>(
          key: const Key('history.filter.needle'),
          label: AppStrings.historyFilterNeedle,
          value: filter.needleTypeId,
          items: [
            for (final n in catalog.needleTypes)
              (value: n.id, label: n.name, key: 'needle.${n.id}'),
          ],
          onChanged: (id) => onChanged(
            id == null
                ? filter.copyWith(anyNeedleType: true)
                : filter.copyWith(needleTypeId: id),
          ),
        ),
        SegmentedButton<NeedleRole>(
          key: const Key('history.filter.needleRole'),
          showSelectedIcon: false,
          style: SegmentedButton.styleFrom(
            minimumSize: Size(0, tokens.buttonHeight - 8),
          ),
          segments: const [
            ButtonSegment(
              value: NeedleRole.oldNeedle,
              label: Text(AppStrings.historyNeedleOld),
            ),
            ButtonSegment(
              value: NeedleRole.newNeedle,
              label: Text(AppStrings.historyNeedleNew),
            ),
          ],
          selected: {filter.needleRole},
          onSelectionChanged: filter.needleTypeId == null
              ? null
              : (s) => onChanged(filter.copyWith(needleRole: s.single)),
        ),
        if (!filter.isDefault)
          TextButton.icon(
            key: const Key('history.filter.reset'),
            style: TextButton.styleFrom(
              minimumSize: Size(0, tokens.buttonHeight - 8),
            ),
            onPressed: () => onChanged(const HistoryFilter()),
            icon: const Icon(Icons.filter_alt_off),
            label: const Text(AppStrings.historyFilterReset),
          ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return ChoiceChip(
      label: Text(label),
      avatar: icon == null ? null : Icon(icon),
      selected: selected,
      onSelected: (_) => onTap(),
      labelStyle: Theme.of(context).textTheme.titleMedium,
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingMd,
        vertical: tokens.spacingSm,
      ),
    );
  }
}

typedef _Option<T> = ({T value, String label, String key});

/// A labelled dropdown whose first entry is "Semua" (no filter).
class _Dropdown<T extends Object> extends StatelessWidget {
  const _Dropdown({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String label;
  final T? value;
  final List<_Option<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    // A value no longer offered (catalogue changed) shows as "Semua".
    final current = items.any((i) => i.value == value) ? value : null;
    return ConstrainedBox(
      constraints: BoxConstraints(
        minHeight: tokens.buttonHeight - 8,
        minWidth: 240,
        maxWidth: 240,
      ),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          contentPadding: EdgeInsets.symmetric(
            horizontal: tokens.spacingMd,
            vertical: tokens.spacingXs,
          ),
          border: const OutlineInputBorder(),
          isDense: true,
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<T?>(
            value: current,
            isDense: true,
            isExpanded: true,
            style: theme.textTheme.titleMedium,
            items: [
              DropdownMenuItem<T?>(
                key: const Key('history.option.all'),
                child: const Text(AppStrings.historyFilterAll),
              ),
              for (final item in items)
                DropdownMenuItem<T?>(
                  key: Key('history.option.${item.key}'),
                  value: item.value,
                  child: Text(item.label, overflow: TextOverflow.ellipsis),
                ),
            ],
            onChanged: onChanged,
          ),
        ),
      ),
    );
  }
}
