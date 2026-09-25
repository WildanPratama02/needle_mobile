import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_remote_data_source.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';

/// Joins `GET /inventory/trolleys/{trolleyId}` with the bootstrap needle-type
/// cache for a display name (contract matrix, "Trolley stock view": the
/// endpoint returns needle **code** only).
class InventoryStockRepositoryImpl implements TrolleyStockRepository {
  const InventoryStockRepositoryImpl({
    required this._remote,
    required this._masterData,
  });

  final InventoryRemoteDataSource _remote;
  final MasterDataRepository _masterData;

  @override
  Future<TrolleyStockOutcome> trolleyStock(String trolleyId) async {
    final result = await _remote.trolleyStock(trolleyId);
    return switch (result) {
      ApiFailure(:final error) => TrolleyStockFailed(error),
      ApiSuccess(:final data) => TrolleyStockLoaded(
        await _mapItems(data.items),
      ),
    };
  }

  Future<List<TrolleyStockItem>> _mapItems(
    List<TrolleyStockItemDto> items,
  ) async {
    final needleTypes = await _masterData.needleTypes();
    final nameById = {for (final n in needleTypes) n.id: n.name};
    return [
      for (final item in items)
        TrolleyStockItem(
          needleTypeId: item.needleTypeId,
          needleTypeCode: item.needleTypeCode,
          displayName: nameById[item.needleTypeId] ?? item.needleTypeCode,
          quantity: item.quantity,
          minimumStock: item.minimumStock,
          status: TrolleyStockStatus.fromWire(item.stockStatus),
        ),
    ];
  }
}
