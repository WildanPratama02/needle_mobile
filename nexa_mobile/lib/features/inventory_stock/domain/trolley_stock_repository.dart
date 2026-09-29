import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_view.dart';

sealed class TrolleyStockOutcome {
  const TrolleyStockOutcome();
}

final class TrolleyStockLoaded extends TrolleyStockOutcome {
  const TrolleyStockLoaded(this.items);

  final List<TrolleyStockItem> items;
}

final class TrolleyStockFailed extends TrolleyStockOutcome {
  const TrolleyStockFailed(this.error);

  final AppError error;
}

/// `GET /inventory/trolleys/{trolleyId}` (FR-MOB-015, Docs/12).
///
/// [trolleyStock] always asks the backend; every successful answer is also
/// kept in `local_trolley_stock`, so [cachedTrolleyStock] can show it —
/// marked stale with its time — while offline (contract matrix MG-9). The
/// Home card shows the live read only; the stock screen falls back to the
/// cached copy. The tablet never edits stock: these are read-only hints.
abstract interface class TrolleyStockRepository {
  Future<TrolleyStockOutcome> trolleyStock(String trolleyId);

  /// The last answer kept for [trolleyId]; `null` if none was ever read.
  Future<CachedTrolleyStock?> cachedTrolleyStock(String trolleyId);
}
