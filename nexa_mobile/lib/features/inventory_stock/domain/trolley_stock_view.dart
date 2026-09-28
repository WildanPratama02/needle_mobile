import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_item.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';

/// The last stock answer kept on the tablet for one trolley (FR-MOB-015,
/// contract matrix "Trolley stock view": offline → last cached copy).
final class CachedTrolleyStock {
  const CachedTrolleyStock({required this.items, required this.fetchedAt});

  final List<TrolleyStockItem> items;

  /// Local time the backend's answer arrived.
  final DateTime fetchedAt;
}

/// What the stock screen shows: the rows, when the backend produced them,
/// and whether they are a stale copy.
///
/// [stale] is `true` whenever the rows did not come from a read made just
/// now — the tablet is offline, or the read failed ([error] then says why).
/// A stale copy is a display hint only, never a balance (ADR-004).
final class TrolleyStockView {
  TrolleyStockView({
    required List<TrolleyStockItem> items,
    required this.fetchedAt,
    this.stale = false,
    this.error,
  }) : items = sortTrolleyStock(items);

  /// Out-of-stock first, then low, then the rest (FR-MOB-015).
  final List<TrolleyStockItem> items;
  final DateTime fetchedAt;
  final bool stale;

  /// Why a fresh read was not possible (`null` when simply offline).
  final AppError? error;
}

/// Result of [loadTrolleyStockView].
sealed class TrolleyStockViewOutcome {
  const TrolleyStockViewOutcome();
}

final class TrolleyStockShown extends TrolleyStockViewOutcome {
  const TrolleyStockShown(this.view);

  final TrolleyStockView view;
}

/// Nothing to show: no fresh answer and no copy was ever kept.
final class TrolleyStockUnavailable extends TrolleyStockViewOutcome {
  const TrolleyStockUnavailable({required this.offline, this.error});

  final bool offline;
  final AppError? error;
}

/// The stock screen's read (FR-MOB-015): online, ask the backend; when that
/// is impossible (offline) or fails, show the last kept copy marked stale —
/// never a number presented as current that is not.
Future<TrolleyStockViewOutcome> loadTrolleyStockView(
  TrolleyStockRepository repository,
  String trolleyId, {
  required bool offline,
  required DateTime now,
}) async {
  AppError? error;
  if (!offline) {
    switch (await repository.trolleyStock(trolleyId)) {
      case TrolleyStockLoaded(:final items):
        return TrolleyStockShown(
          TrolleyStockView(items: items, fetchedAt: now),
        );
      case TrolleyStockFailed(error: final failure):
        error = failure;
    }
  }
  final cached = await repository.cachedTrolleyStock(trolleyId);
  if (cached == null) {
    return TrolleyStockUnavailable(offline: offline, error: error);
  }
  return TrolleyStockShown(
    TrolleyStockView(
      items: cached.items,
      fetchedAt: cached.fetchedAt,
      stale: true,
      error: error,
    ),
  );
}

/// Urgency order of a stock status: `OUT` → `LOW` → `NORMAL` → unknown.
int _rank(TrolleyStockStatus status) => switch (status) {
  TrolleyStockStatus.critical => 0,
  TrolleyStockStatus.low => 1,
  TrolleyStockStatus.normal => 2,
  TrolleyStockStatus.unknown => 3,
};

/// Out/low first so the PIC sees what needs a refill; within one status by
/// quantity (lowest first), then by name.
List<TrolleyStockItem> sortTrolleyStock(Iterable<TrolleyStockItem> items) =>
    [...items]..sort((a, b) {
      final byStatus = _rank(a.status).compareTo(_rank(b.status));
      if (byStatus != 0) return byStatus;
      final byQuantity = a.quantity.compareTo(b.quantity);
      if (byQuantity != 0) return byQuantity;
      return a.displayName.toLowerCase().compareTo(b.displayName.toLowerCase());
    });
