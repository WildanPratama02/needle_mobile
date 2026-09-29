import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

class HistoryRemoteDataSource {
  const HistoryRemoteDataSource(this._api);

  final ApiClient _api;

  /// `GET /exchanges` with [query] as built by `historyQueryParams`.
  ///
  /// Each row is parsed with the shared exchange parser; a row that cannot be
  /// read (an Exchange State this build does not know) is skipped and
  /// logged rather than failing the whole page.
  Future<ApiResult<List<ExchangeSnapshot>>> exchanges(
    Map<String, Object?> query,
  ) => _api.get(
    '/exchanges',
    query: query,
    decode: (data) {
      final rows = <ExchangeSnapshot>[];
      for (final item in data! as List<Object?>) {
        try {
          rows.add(parseExchange(item));
        } on FormatException catch (e) {
          AppLogger.warning('history', 'history row skipped: $e');
        }
      }
      return rows;
    },
  );
}
