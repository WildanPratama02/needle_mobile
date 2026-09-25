import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';

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

/// `GET /inventory/trolleys/{trolleyId}` (FR-MOB-015, Docs/12). Online-only
/// for v1 — the contract matrix (MG-9) leaves the Drift-backed "last cached
/// copy, marked stale" offline path as a P2 follow-up; a call while offline
/// simply surfaces [TrolleyStockFailed] and the Home card shows its
/// unavailable state rather than a stale number presented as current.
abstract interface class TrolleyStockRepository {
  Future<TrolleyStockOutcome> trolleyStock(String trolleyId);
}
