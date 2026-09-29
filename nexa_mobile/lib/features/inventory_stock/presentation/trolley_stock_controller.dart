import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_view.dart';

/// The trolley stock screen's data (FR-MOB-015): a fresh read while online,
/// else the last kept copy marked stale. Re-reads when the tablet comes back
/// online, on pull-to-refresh, and when invalidated after an exchange
/// completes or a sync confirms an issue (stock moved on the server).
class TrolleyStockController extends AsyncNotifier<TrolleyStockViewOutcome> {
  TrolleyStockController(this.trolleyId);

  final String trolleyId;

  @override
  Future<TrolleyStockViewOutcome> build() {
    final offline = ref.watch(
      connectivityStatusProvider.select(
        (s) => s.value == ConnectivityStatus.offline,
      ),
    );
    return loadTrolleyStockView(
      ref.watch(trolleyStockRepositoryProvider),
      trolleyId,
      offline: offline,
      now: DateTime.now(),
    );
  }

  /// Pull-to-refresh: read again, keeping the current rows on screen until
  /// the answer arrives.
  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

final trolleyStockControllerProvider = AsyncNotifierProvider.autoDispose
    .family<TrolleyStockController, TrolleyStockViewOutcome, String>(
      TrolleyStockController.new,
    );
