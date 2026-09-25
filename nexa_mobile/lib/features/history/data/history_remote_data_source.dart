import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';

class HistoryRemoteDataSource {
  const HistoryRemoteDataSource(this._api);

  final ApiClient _api;

  /// `pageSize: 1` — only `meta.total` is read by the caller, so the page
  /// body itself is discarded.
  Future<ApiResult<Object?>> exchangesOn({
    required String deviceId,
    required DateTime dateFrom,
    required DateTime dateTo,
  }) => _api.get(
    '/exchanges',
    query: {
      'deviceId': deviceId,
      'dateFrom': dateFrom.toIso8601String(),
      'dateTo': dateTo.toIso8601String(),
      'pageSize': 1,
    },
    decode: (data) => data,
  );
}
