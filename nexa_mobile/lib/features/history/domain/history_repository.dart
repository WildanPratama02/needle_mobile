import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';

sealed class TodayExchangeCountOutcome {
  const TodayExchangeCountOutcome();
}

final class TodayExchangeCountLoaded extends TodayExchangeCountOutcome {
  const TodayExchangeCountLoaded(this.count);

  final int count;
}

final class TodayExchangeCountFailed extends TodayExchangeCountOutcome {
  const TodayExchangeCountFailed(this.error);

  final AppError error;
}

sealed class HistoryPageOutcome {
  const HistoryPageOutcome();
}

/// One page of `GET /exchanges` (`meta`: page, pageSize, total, totalPages).
final class HistoryPageLoaded extends HistoryPageOutcome {
  const HistoryPageLoaded({
    required this.rows,
    required this.page,
    required this.totalPages,
    required this.total,
  });

  final List<ExchangeSnapshot> rows;
  final int page;
  final int totalPages;
  final int total;
}

final class HistoryPageFailed extends HistoryPageOutcome {
  const HistoryPageFailed(this.error);

  final AppError error;
}

/// `GET /exchanges` (FR-MOB-014, Docs/12 §10), always scoped to this device.
///
/// Online reads only: the offline history is the tablet's own
/// `local_exchange` records (through the sync view source), merged by
/// `mergeHistory` — server pages are never cached and replayed as if fresh.
abstract interface class HistoryRepository {
  /// Home's "Transaksi hari ini: N" (`meta.total` of today's window).
  Future<TodayExchangeCountOutcome> todayExchangeCount({
    required String deviceId,
    required DateTime today,
  });

  /// One page of the history list for [filter] within [window], newest
  /// first (`createdAt desc, id desc` on the backend).
  Future<HistoryPageOutcome> page({
    required String deviceId,
    required HistoryFilter filter,
    required HistoryWindow window,
    required int page,
    int pageSize = historyPageSize,
  });
}
