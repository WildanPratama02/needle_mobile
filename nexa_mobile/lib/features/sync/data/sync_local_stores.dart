import 'dart:async';

import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_repository.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';

/// [SyncCheckpointStore] on `local_sync_state` (one row).
class SyncCheckpointStoreImpl implements SyncCheckpointStore {
  const SyncCheckpointStoreImpl(this._db);

  final AppDatabase _db;

  @override
  Future<SyncCheckpoint> read() async {
    final row = await _db.select(_db.localSyncState).getSingleOrNull();
    return SyncCheckpoint(
      deviceId: row?.deviceId,
      cursor: row?.cursor,
      lastSyncAt: row?.lastSyncAt,
    );
  }

  @override
  Future<void> save({
    required String deviceId,
    required String cursor,
    required DateTime syncedAt,
  }) => _db
      .into(_db.localSyncState)
      .insertOnConflictUpdate(
        LocalSyncStateCompanion.insert(
          slot: const Value(0),
          deviceId: deviceId,
          cursor: Value(cursor),
          lastSyncAt: Value(syncedAt),
        ),
      );

  @override
  Future<void> resetCursor(String deviceId) async {
    final current = await read();
    await _db
        .into(_db.localSyncState)
        .insertOnConflictUpdate(
          LocalSyncStateCompanion.insert(
            slot: const Value(0),
            deviceId: deviceId,
            cursor: const Value(null),
            lastSyncAt: Value(current.lastSyncAt),
          ),
        );
  }
}

/// [SyncViewSource]: exchanges + their commands + their waiting photos,
/// re-read whenever one of the three tables changes.
class SyncViewSourceImpl implements SyncViewSource {
  const SyncViewSourceImpl(
    this._db,
    this._exchanges,
    this._queue,
    this._photos,
  );

  final AppDatabase _db;
  final ActiveExchangeStore _exchanges;
  final SyncQueue _queue;
  final EvidenceRepository _photos;

  @override
  Future<List<ExchangeSyncView>> load() async {
    final photos = await _photos.awaitingUpload();
    final views = <ExchangeSyncView>[];
    for (final record in await _exchanges.all()) {
      final ctx = record.clientTransactionId;
      views.add(
        ExchangeSyncView(
          clientTransactionId: ctx,
          createdAt: record.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0),
          exchangeNumber: record.exchangeNumber,
          serverState: record.lastKnownState,
          confirmationStatus: record.confirmationStatus,
          hasServerRecord: record.serverExchangeId != null,
          commands: await _queue.commandsFor(ctx),
          photosAwaitingUpload: photos
              .where((p) => p.clientTransactionId == ctx)
              .length,
          closed: record.closedAt != null,
          operatorName: record.operator?.name,
        ),
      );
    }
    return views;
  }

  @override
  Stream<List<ExchangeSyncView>> watch() async* {
    yield await load();
    yield* _db
        .tableUpdates(
          TableUpdateQuery.onAllTables([
            _db.localSyncQueue,
            _db.localExchange,
            _db.localExchangeEvidence,
          ]),
        )
        .asyncMap((_) => load());
  }
}
