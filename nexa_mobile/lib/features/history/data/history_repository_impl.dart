import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/history/data/history_remote_data_source.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';

class HistoryRepositoryImpl implements HistoryRepository {
  const HistoryRepositoryImpl(this._remote);

  final HistoryRemoteDataSource _remote;

  @override
  Future<TodayExchangeCountOutcome> todayExchangeCount({
    required String deviceId,
    required DateTime today,
  }) async {
    // Only `meta.total` is read, so one row per page is enough.
    final result = await _remote.exchanges(
      historyQueryParams(
        deviceId: deviceId,
        filter: const HistoryFilter(),
        window: historyWindow(const HistoryFilter(), today),
        page: 1,
        pageSize: 1,
      ),
    );
    return switch (result) {
      ApiFailure(:final error) => TodayExchangeCountFailed(error),
      ApiSuccess(:final meta) => TodayExchangeCountLoaded(meta.total ?? 0),
    };
  }

  @override
  Future<HistoryPageOutcome> page({
    required String deviceId,
    required HistoryFilter filter,
    required HistoryWindow window,
    required int page,
    int pageSize = historyPageSize,
  }) async {
    final result = await _remote.exchanges(
      historyQueryParams(
        deviceId: deviceId,
        filter: filter,
        window: window,
        page: page,
        pageSize: pageSize,
      ),
    );
    return switch (result) {
      ApiFailure(:final error) => HistoryPageFailed(error),
      ApiSuccess(:final data, :final meta) => HistoryPageLoaded(
        rows: data,
        page: meta.page ?? page,
        totalPages: meta.totalPages ?? page,
        total: meta.total ?? data.length,
      ),
    };
  }
}
