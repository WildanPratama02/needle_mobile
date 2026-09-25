import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';

typedef _Json = Map<String, Object?>;

/// One row of `data.items` on `GET /inventory/trolleys/{trolleyId}`.
final class TrolleyStockItemDto {
  const TrolleyStockItemDto({
    required this.needleTypeId,
    required this.needleTypeCode,
    required this.quantity,
    required this.minimumStock,
    required this.stockStatus,
  });

  factory TrolleyStockItemDto.fromJson(Object? json) {
    final map = json! as _Json;
    return TrolleyStockItemDto(
      needleTypeId: map['needleTypeId']! as String,
      needleTypeCode: map['needleTypeCode']! as String,
      quantity: (map['quantity']! as num).toInt(),
      minimumStock: (map['minimumStock']! as num).toInt(),
      stockStatus: map['stockStatus'] as String?,
    );
  }

  final String needleTypeId;
  final String needleTypeCode;
  final int quantity;
  final int minimumStock;
  final String? stockStatus;
}

final class TrolleyStockResponseDto {
  const TrolleyStockResponseDto({required this.items});

  factory TrolleyStockResponseDto.fromJson(Object? json) {
    final map = json! as _Json;
    final items = (map['items']! as List<Object?>)
        .map((e) => TrolleyStockItemDto.fromJson(e))
        .toList(growable: false);
    return TrolleyStockResponseDto(items: items);
  }

  final List<TrolleyStockItemDto> items;
}

class InventoryRemoteDataSource {
  const InventoryRemoteDataSource(this._api);

  final ApiClient _api;

  Future<ApiResult<TrolleyStockResponseDto>> trolleyStock(String trolleyId) =>
      _api.get(
        '/inventory/trolleys/$trolleyId',
        decode: TrolleyStockResponseDto.fromJson,
      );
}
