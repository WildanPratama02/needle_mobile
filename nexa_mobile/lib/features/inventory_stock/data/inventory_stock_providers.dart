import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_remote_data_source.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_repository_impl.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';

final _inventoryRemoteProvider = Provider<InventoryRemoteDataSource>(
  (ref) => InventoryRemoteDataSource(ref.watch(apiClientProvider)),
);

final trolleyStockRepositoryProvider = Provider<TrolleyStockRepository>(
  (ref) => InventoryStockRepositoryImpl(
    remote: ref.watch(_inventoryRemoteProvider),
    masterData: ref.watch(masterDataRepositoryProvider),
  ),
);

/// The current trolley's stock hint for the Home dashboard
/// (`STOK TROLI SAAT INI`). `autoDispose` so a stale trolley id from a
/// previous device binding is never reused.
final trolleyStockProvider = FutureProvider.autoDispose
    .family<TrolleyStockOutcome, String>(
      (ref, trolleyId) =>
          ref.watch(trolleyStockRepositoryProvider).trolleyStock(trolleyId),
    );
