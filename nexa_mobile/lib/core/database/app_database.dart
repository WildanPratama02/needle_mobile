import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:nexa_mobile/core/database/app_database.steps.dart';
import 'package:nexa_mobile/core/database/tables.dart';

part 'app_database.g.dart';

/// The tablet's local database (Drift, `nexa_mobile/CLAUDE.md` §2).
///
/// Unencrypted in v1 by decision — it holds cache only, no credentials.
/// Every schema change bumps [schemaVersion] and adds a migration step: this
/// ships to factory tablets, so a destructive change is a data-loss bug.
@DriftDatabase(
  tables: [
    LocalUserSession,
    LocalDeviceContext,
    LocalDeviceValidation,
    LocalNeedleType,
    LocalExchangeType,
    LocalStorageMapping,
    LocalMasterDataVersion,
    LocalExchange,
    LocalExchangeEvidence,
    LocalSyncQueue,
    LocalSyncState,
    LocalTrolleyStock,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  /// Opens the on-device database file.
  factory AppDatabase.open() => AppDatabase(driftDatabase(name: 'nexa_mobile'));

  @override
  int get schemaVersion => 4;

  /// Snapshots of every version live in `drift_schemas/`
  /// (`dart run drift_dev make-migrations`); `test/drift/` proves each step.
  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: stepByStep(
      // v2: resumable online exchange (Phase 6–8). Additive only — v1 caches
      // are kept.
      from1To2: (m, schema) async {
        await m.createTable(schema.localExchange);
        await m.createTable(schema.localExchangeEvidence);
      },
      // v3: offline sync (Phase 9). Additive only — an exchange left
      // unfinished under v2 keeps its row and resumes; the new columns start
      // empty and are filled by the next server answer.
      from2To3: (m, schema) async {
        await m.addColumn(
          schema.localExchange,
          schema.localExchange.serverSnapshot,
        );
        await m.addColumn(
          schema.localExchange,
          schema.localExchange.confirmationStatus,
        );
        await m.addColumn(schema.localExchange, schema.localExchange.closedAt);
        await m.addColumn(
          schema.localExchange,
          schema.localExchange.syncConfirmedAt,
        );
        await m.createTable(schema.localSyncQueue);
        await m.createTable(schema.localSyncState);
      },
      // v4: last trolley stock answer for the offline stock view (Phase 10).
      // Additive only — starts empty, filled by the next online read.
      from3To4: (m, schema) async {
        await m.createTable(schema.localTrolleyStock);
      },
    ),
  );
}
