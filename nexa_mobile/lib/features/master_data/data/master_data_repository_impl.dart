import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

/// Drift-backed master-data cache (`local_needle_type`, `local_exchange_type`,
/// `local_storage_mapping`, `local_master_data_version`).
class MasterDataRepositoryImpl implements MasterDataRepository {
  const MasterDataRepositoryImpl(this._db);

  final AppDatabase _db;

  @override
  Future<MasterDataVersions> storedVersions() async {
    final rows = await _db.select(_db.localMasterDataVersion).get();
    final byName = {for (final c in MasterDataCollection.values) c.name: c};
    return MasterDataVersions({
      for (final row in rows)
        if (byName[row.collection] != null)
          byName[row.collection]!: row.version,
    });
  }

  @override
  Future<void> apply({
    required MasterDataVersions sent,
    required MasterDataPayload received,
  }) {
    final plan = planMasterDataUpdate(sent: sent, received: received);
    return _db.transaction(() async {
      for (final MapEntry(key: collection, value: update) in plan.entries) {
        switch (update) {
          case KeepCollection():
            break;
          case InvalidateCollectionVersion():
            await _deleteVersion(collection);
          case ReplaceCollection(:final version):
            await _replaceRows(collection, received);
            if (version == null) {
              await _deleteVersion(collection);
            } else {
              await _db
                  .into(_db.localMasterDataVersion)
                  .insertOnConflictUpdate(
                    LocalMasterDataVersionCompanion.insert(
                      collection: collection.name,
                      version: version,
                    ),
                  );
            }
        }
      }
    });
  }

  Future<void> _deleteVersion(MasterDataCollection collection) => (_db.delete(
    _db.localMasterDataVersion,
  )..where((t) => t.collection.equals(collection.name))).go();

  Future<void> _replaceRows(
    MasterDataCollection collection,
    MasterDataPayload received,
  ) async {
    switch (collection) {
      case MasterDataCollection.needleTypes:
        await _db.delete(_db.localNeedleType).go();
        await _db.batch(
          (b) => b.insertAll(_db.localNeedleType, [
            for (final n in received.needleTypes!)
              LocalNeedleTypeCompanion.insert(
                id: n.id,
                code: n.code,
                name: n.name,
                category: Value(n.category),
                unit: n.unit,
                minimumStock: n.minimumStock,
              ),
          ]),
        );
      case MasterDataCollection.exchangeTypes:
        await _db.delete(_db.localExchangeType).go();
        await _db.batch(
          (b) => b.insertAll(_db.localExchangeType, [
            for (final e in received.exchangeTypes!)
              LocalExchangeTypeCompanion.insert(
                id: e.id,
                code: e.code,
                name: e.name,
                requiresFragmentValidation: e.requiresFragmentValidation,
              ),
          ]),
        );
      case MasterDataCollection.storageMappings:
        await _db.delete(_db.localStorageMapping).go();
        await _db.batch(
          (b) => b.insertAll(_db.localStorageMapping, [
            for (final s in received.storageMappings!)
              LocalStorageMappingCompanion.insert(
                id: s.id,
                exchangeTypeId: s.exchangeTypeId,
                storageLocationId: s.storageLocationId,
                storageLocationCode: s.storageLocationCode,
                storageLocationName: s.storageLocationName,
              ),
          ]),
        );
    }
  }

  @override
  Future<List<NeedleType>> needleTypes() async {
    final rows = await (_db.select(
      _db.localNeedleType,
    )..orderBy([(t) => OrderingTerm.asc(t.code)])).get();
    return [
      for (final r in rows)
        NeedleType(
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          minimumStock: r.minimumStock,
        ),
    ];
  }

  @override
  Future<List<ExchangeType>> exchangeTypes() async {
    final rows = await (_db.select(
      _db.localExchangeType,
    )..orderBy([(t) => OrderingTerm.asc(t.code)])).get();
    return [
      for (final r in rows)
        ExchangeType(
          id: r.id,
          code: r.code,
          name: r.name,
          requiresFragmentValidation: r.requiresFragmentValidation,
        ),
    ];
  }

  @override
  Future<List<StorageMapping>> storageMappings() async {
    final rows = await _db.select(_db.localStorageMapping).get();
    return [
      for (final r in rows)
        StorageMapping(
          id: r.id,
          exchangeTypeId: r.exchangeTypeId,
          storageLocationId: r.storageLocationId,
          storageLocationCode: r.storageLocationCode,
          storageLocationName: r.storageLocationName,
        ),
    ];
  }

  @override
  Future<void> clear() => _db.transaction(() async {
    await _db.delete(_db.localNeedleType).go();
    await _db.delete(_db.localExchangeType).go();
    await _db.delete(_db.localStorageMapping).go();
    await _db.delete(_db.localMasterDataVersion).go();
  });
}
