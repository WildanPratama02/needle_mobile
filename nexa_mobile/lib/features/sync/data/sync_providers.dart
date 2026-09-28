import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_providers.dart';
import 'package:nexa_mobile/features/sync/data/sync_local_stores.dart';
import 'package:nexa_mobile/features/sync/data/sync_queue_impl.dart';
import 'package:nexa_mobile/features/sync/data/sync_remote_data_source.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_engine.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';

final syncQueueProvider = Provider<SyncQueue>(
  (ref) => SyncQueueImpl(ref.watch(appDatabaseProvider)),
);

final syncCheckpointStoreProvider = Provider<SyncCheckpointStore>(
  (ref) => SyncCheckpointStoreImpl(ref.watch(appDatabaseProvider)),
);

final syncGatewayProvider = Provider<SyncGateway>(
  (ref) => SyncRemoteDataSource(ref.watch(apiClientProvider)),
);

/// The one engine instance: it owns the "one sync in flight" guard.
final syncEngineProvider = Provider<SyncEngine>(
  (ref) => SyncEngine(
    queue: ref.watch(syncQueueProvider),
    gateway: ref.watch(syncGatewayProvider),
    checkpoints: ref.watch(syncCheckpointStoreProvider),
    exchanges: ref.watch(activeExchangeStoreProvider),
    evidence: ref.watch(evidenceRepositoryProvider),
    masterData: ref.watch(masterDataRefresherProvider),
  ),
);

final syncViewSourceProvider = Provider<SyncViewSource>(
  (ref) => SyncViewSourceImpl(
    ref.watch(appDatabaseProvider),
    ref.watch(activeExchangeStoreProvider),
    ref.watch(syncQueueProvider),
    ref.watch(evidenceRepositoryProvider),
  ),
);

/// Every local exchange with its sync bookkeeping, live.
final syncViewsProvider = StreamProvider<List<ExchangeSyncView>>(
  (ref) => ref.watch(syncViewSourceProvider).watch(),
);

/// Periodic pull while online (approver decisions, supervisor cancels, the
/// 5-minute tail of the retry schedule). Tests override it.
final syncPeriodicIntervalProvider = Provider<Duration>(
  (ref) => const Duration(minutes: 1),
);
