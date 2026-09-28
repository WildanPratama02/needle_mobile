import 'dart:convert';

import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_remote_data_source.dart';

/// `local_trolley_stock` (schema v4): the last stock answer per trolley.
class TrolleyStockLocalDataSource {
  const TrolleyStockLocalDataSource(this._db);

  final AppDatabase _db;

  Future<void> write(
    String trolleyId,
    List<TrolleyStockItemDto> items,
    DateTime fetchedAt,
  ) => _db
      .into(_db.localTrolleyStock)
      .insertOnConflictUpdate(
        LocalTrolleyStockCompanion.insert(
          trolleyId: trolleyId,
          items: jsonEncode([for (final i in items) i.toJson()]),
          fetchedAt: fetchedAt,
        ),
      );

  Future<({List<TrolleyStockItemDto> items, DateTime fetchedAt})?> read(
    String trolleyId,
  ) async {
    final row = await (_db.select(
      _db.localTrolleyStock,
    )..where((t) => t.trolleyId.equals(trolleyId))).getSingleOrNull();
    if (row == null) return null;
    try {
      final items = (jsonDecode(row.items) as List<Object?>)
          .map(TrolleyStockItemDto.fromJson)
          .toList(growable: false);
      return (items: items, fetchedAt: row.fetchedAt);
    } on FormatException catch (e) {
      AppLogger.warning('inventory', 'unreadable stock cache: $e');
      return null;
    } on TypeError catch (e) {
      AppLogger.warning('inventory', 'unreadable stock cache: $e');
      return null;
    }
  }
}
