import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
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
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  /// Opens the on-device database file.
  factory AppDatabase.open() => AppDatabase(driftDatabase(name: 'nexa_mobile'));

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    // v2 (Phase 9) adds the sync queue tables here with `m.createTable`.
    onUpgrade: (m, from, to) async {},
  );
}
