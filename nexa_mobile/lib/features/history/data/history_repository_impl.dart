import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/history/data/history_remote_data_source.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';

class HistoryRepositoryImpl implements HistoryRepository {
  const HistoryRepositoryImpl(this._remote);

  final HistoryRemoteDataSource _remote;

  @override
  Future<TodayExchangeCountOutcome> todayExchangeCount({
    required String deviceId,
    required DateTime today,
  }) async {
    final from = DateTime(today.year, today.month, today.day);
    final to = from.add(const Duration(days: 1));
    final result = await _remote.exchangesOn(
      deviceId: deviceId,
      dateFrom: from,
      dateTo: to,
    );
    return switch (result) {
      ApiFailure(:final error) => TodayExchangeCountFailed(error),
      ApiSuccess(:final meta) => TodayExchangeCountLoaded(meta.total ?? 0),
    };
  }
}
