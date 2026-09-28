import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_remote_data_source.dart';
import 'package:nexa_mobile/features/inventory_stock/data/trolley_stock_local_data_source.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_view.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';

/// Joins `GET /inventory/trolleys/{trolleyId}` with the bootstrap needle-type
/// cache for a display name (contract matrix, "Trolley stock view": the
/// endpoint returns needle **code** only), and keeps every successful answer
/// for the offline stock view.
class InventoryStockRepositoryImpl implements TrolleyStockRepository {
  InventoryStockRepositoryImpl({
    required this._remote,
    required this._masterData,
    required this._local,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final InventoryRemoteDataSource _remote;
  final MasterDataRepository _masterData;
  final TrolleyStockLocalDataSource _local;
  final DateTime Function() _now;

  @override
  Future<TrolleyStockOutcome> trolleyStock(String trolleyId) async {
    final result = await _remote.trolleyStock(trolleyId);
    switch (result) {
      case ApiFailure(:final error):
        return TrolleyStockFailed(error);
      case ApiSuccess(:final data):
        try {
          await _local.write(trolleyId, data.items, _now());
        } on Object catch (e) {
          // The cache is a convenience; a failed write never hides the answer.
          AppLogger.warning('inventory', 'stock cache write failed: $e');
        }
        return TrolleyStockLoaded(await _mapItems(data.items));
    }
  }

  @override
  Future<CachedTrolleyStock?> cachedTrolleyStock(String trolleyId) async {
    final cached = await _local.read(trolleyId);
    if (cached == null) return null;
    return CachedTrolleyStock(
      items: await _mapItems(cached.items),
      fetchedAt: cached.fetchedAt,
    );
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
