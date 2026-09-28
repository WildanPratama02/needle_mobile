import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/clock/server_clock.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/features/history/domain/history_merge.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_controller.dart';

/// Where the rows of the history list come from right now.
enum HistorySource {
  /// Server pages loaded (plus this tablet's unsynced exchanges).
  server,

  /// The tablet is offline: its saved exchanges only.
  offline,

  /// The server could not be reached (timeout, 5xx): saved exchanges only.
  unreachable,

  /// The server answered with an error: saved exchanges only.
  failed,
}

final class HistoryState {
  const HistoryState({
    required this.filter,
    required this.window,
    this.serverRows = const [],
    this.page = 0,
    this.totalPages = 0,
    this.total = 0,
    this.loading = true,
    this.loadingMore = false,
    this.source = HistorySource.server,
    this.error,
    this.loadMoreError,
  });

  final HistoryFilter filter;

  /// The instant window [filter] meant when the list was last loaded.
  final HistoryWindow window;

  /// Every server page loaded so far, in order.
  final List<ExchangeSnapshot> serverRows;
  final int page;
  final int totalPages;

  /// `meta.total` of the server list.
  final int total;

  /// The first page is being read.
  final bool loading;
  final bool loadingMore;
  final HistorySource source;

  /// Why the server list is not shown ([HistorySource.failed] /
  /// [HistorySource.unreachable]).
  final AppError? error;

  /// The last "next page" read failed; the rows already shown stay.
  final AppError? loadMoreError;

  bool get serverAvailable => source == HistorySource.server;
  bool get hasMore => serverAvailable && page < totalPages;

  HistoryState copyWith({
    HistoryFilter? filter,
    HistoryWindow? window,
    List<ExchangeSnapshot>? serverRows,
    int? page,
    int? totalPages,
    int? total,
    bool? loading,
    bool? loadingMore,
    HistorySource? source,
    AppError? error,
    bool clearError = false,
    AppError? loadMoreError,
    bool clearLoadMoreError = false,
  }) => HistoryState(
    filter: filter ?? this.filter,
    window: window ?? this.window,
    serverRows: serverRows ?? this.serverRows,
    page: page ?? this.page,
    totalPages: totalPages ?? this.totalPages,
    total: total ?? this.total,
    loading: loading ?? this.loading,
    loadingMore: loadingMore ?? this.loadingMore,
    source: source ?? this.source,
    error: clearError ? null : (error ?? this.error),
    loadMoreError: clearLoadMoreError
        ? null
        : (loadMoreError ?? this.loadMoreError),
  );
}

/// The history list (FR-MOB-014): filters, server paging (infinite scroll),
/// pull-to-refresh, and the offline fallback. Reloads page 1 when the filter
/// changes and when connectivity flips; the merge with local exchanges is
/// [historyEntriesProvider].
class HistoryController extends Notifier<HistoryState> {
  /// Answers of an older load (the filter changed meanwhile) are dropped.
  int _generation = 0;

  @override
  HistoryState build() {
    final offline = ref.watch(
      connectivityStatusProvider.select(
        (s) => s.value == ConnectivityStatus.offline,
      ),
    );
    final filter = stateOrNull?.filter ?? const HistoryFilter();
    unawaited(Future.microtask(() => _reload(offline: offline)));
    return HistoryState(filter: filter, window: _windowFor(filter));
  }

  String? get _deviceId =>
      switch (ref.read(deviceValidationControllerProvider)) {
        ValidationPassed(:final context) => context.device.id,
        _ => null,
      };

  bool get _offline =>
      ref.read(connectivityStatusProvider).value == ConnectivityStatus.offline;

  /// "Today" follows the server's clock (Doc 15 §18), in local calendar days.
  HistoryWindow _windowFor(HistoryFilter filter) =>
      historyWindow(filter, DateTime.now().add(ref.read(serverClockProvider)));

  void setFilter(HistoryFilter filter) {
    if (filter == state.filter) return;
    // Rows of the previous filter must not linger under the new one.
    state = state.copyWith(
      filter: filter,
      serverRows: const [],
      page: 0,
      totalPages: 0,
      total: 0,
    );
    unawaited(_reload(offline: _offline));
  }

  /// Pull-to-refresh / "COBA LAGI".
  Future<void> refresh() => _reload(offline: _offline);

  Future<void> _reload({required bool offline}) async {
    if (!ref.mounted) return;
    final generation = ++_generation;
    final filter = state.filter;
    final window = _windowFor(filter);
    state = state.copyWith(
      window: window,
      loading: true,
      loadingMore: false,
      clearLoadMoreError: true,
    );
    final deviceId = _deviceId;
    if (offline || deviceId == null) {
      state = state.copyWith(
        serverRows: const [],
        page: 0,
        totalPages: 0,
        total: 0,
        loading: false,
        source: HistorySource.offline,
        clearError: true,
      );
      return;
    }
    final outcome = await ref
        .read(historyRepositoryProvider)
        .page(deviceId: deviceId, filter: filter, window: window, page: 1);
    if (!ref.mounted || generation != _generation) return;
    switch (outcome) {
      case HistoryPageLoaded(:final rows, :final page, :final totalPages):
        state = state.copyWith(
          serverRows: rows,
          page: page,
          totalPages: totalPages,
          total: outcome.total,
          loading: false,
          source: HistorySource.server,
          clearError: true,
        );
      case HistoryPageFailed(:final error):
        state = state.copyWith(
          serverRows: const [],
          page: 0,
          totalPages: 0,
          total: 0,
          loading: false,
          source: error.isRetryable
              ? HistorySource.unreachable
              : HistorySource.failed,
          error: error,
        );
    }
  }

  /// Infinite scroll: the next server page, appended.
  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore || state.loading) return;
    final deviceId = _deviceId;
    if (deviceId == null) return;
    final generation = _generation;
    state = state.copyWith(loadingMore: true, clearLoadMoreError: true);
    final outcome = await ref
        .read(historyRepositoryProvider)
        .page(
          deviceId: deviceId,
          filter: state.filter,
          window: state.window,
          page: state.page + 1,
        );
    if (!ref.mounted || generation != _generation) return;
    switch (outcome) {
      case HistoryPageLoaded(:final rows, :final page, :final totalPages):
        state = state.copyWith(
          serverRows: [...state.serverRows, ...rows],
          page: page,
          totalPages: totalPages,
          total: outcome.total,
          loadingMore: false,
        );
      case HistoryPageFailed(:final error):
        state = state.copyWith(loadingMore: false, loadMoreError: error);
    }
  }
}

final historyControllerProvider =
    NotifierProvider.autoDispose<HistoryController, HistoryState>(
      HistoryController.new,
    );

/// The rows on screen: server pages merged with this tablet's exchanges
/// (live — a sync moving a local exchange updates its badge at once).
final historyEntriesProvider = Provider.autoDispose<List<HistoryEntry>>((ref) {
  final validation = ref.watch(deviceValidationControllerProvider);
  if (validation is! ValidationPassed) return const [];
  final history = ref.watch(historyControllerProvider);
  final views = ref.watch(syncViewsProvider).value ?? const [];
  final syncing = ref.watch(syncControllerProvider.select((s) => s.running));
  return mergeHistory(
    serverRows: history.serverRows,
    localViews: views,
    deviceId: validation.context.device.id,
    filter: history.filter,
    window: history.window,
    serverAvailable: history.serverAvailable,
    syncing: syncing,
  );
});
