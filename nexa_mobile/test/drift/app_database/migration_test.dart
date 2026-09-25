// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift_dev/api/migrations_native.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:flutter_test/flutter_test.dart';

import 'generated/schema.dart';

import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  late SchemaVerifier verifier;

  setUpAll(() {
    verifier = SchemaVerifier(GeneratedHelper());
  });

  group('simple database migrations', () {
    // These simple tests verify all possible schema updates with a simple (no
    // data) migration. This is a quick way to ensure that written database
    // migrations properly alter the schema.
    const versions = GeneratedHelper.versions;
    for (final (i, fromVersion) in versions.indexed) {
      group('from $fromVersion', () {
        for (final toVersion in versions.skip(i + 1)) {
          test('to $toVersion', () async {
            final schema = await verifier.schemaAt(fromVersion);
            final db = AppDatabase(schema.newConnection());
            await verifier.migrateAndValidate(db, toVersion);
            await db.close();
          });
        }
      });
    }
  });

  // v1 → v2 is additive: every Phase 3 cache row must survive untouched,
  // and the two new tables must start empty and be writable.
  test('migration from v1 to v2 keeps every v1 cache row', () async {
    const needle = (
      id: 'nt-1',
      code: 'DBX1-14',
      name: 'DBx1 #14',
      unit: 'PCS',
      minimumStock: '10.000',
    );
    final oldLocalNeedleTypeData = [
      v1.LocalNeedleTypeData(
        id: needle.id,
        code: needle.code,
        name: needle.name,
        unit: needle.unit,
        minimumStock: needle.minimumStock,
      ),
    ];
    final expectedNewLocalNeedleTypeData = [
      v2.LocalNeedleTypeData(
        id: needle.id,
        code: needle.code,
        name: needle.name,
        unit: needle.unit,
        minimumStock: needle.minimumStock,
      ),
    ];
    const oldLocalMasterDataVersionData = [
      v1.LocalMasterDataVersionData(collection: 'needleTypes', version: 'nv1'),
    ];
    const expectedNewLocalMasterDataVersionData = [
      v2.LocalMasterDataVersionData(collection: 'needleTypes', version: 'nv1'),
    ];
    const oldLocalDeviceValidationData = [
      v1.LocalDeviceValidationData(
        slot: 0,
        deviceId: 'device-1',
        status: 'ACTIVE',
        checkedAt: 1758700000,
      ),
    ];
    const expectedNewLocalDeviceValidationData = [
      v2.LocalDeviceValidationData(
        slot: 0,
        deviceId: 'device-1',
        status: 'ACTIVE',
        checkedAt: 1758700000,
      ),
    ];

    await verifier.testWithDataIntegrity(
      oldVersion: 1,
      newVersion: 2,
      createOld: v1.DatabaseAtV1.new,
      createNew: v2.DatabaseAtV2.new,
      openTestedDatabase: AppDatabase.new,
      createItems: (batch, oldDb) {
        batch.insertAll(oldDb.localNeedleType, oldLocalNeedleTypeData);
        batch.insertAll(
          oldDb.localMasterDataVersion,
          oldLocalMasterDataVersionData,
        );
        batch.insertAll(
          oldDb.localDeviceValidation,
          oldLocalDeviceValidationData,
        );
      },
      validateItems: (newDb) async {
        expect(
          await newDb.select(newDb.localNeedleType).get(),
          expectedNewLocalNeedleTypeData,
        );
        expect(
          await newDb.select(newDb.localMasterDataVersion).get(),
          expectedNewLocalMasterDataVersionData,
        );
        expect(
          await newDb.select(newDb.localDeviceValidation).get(),
          expectedNewLocalDeviceValidationData,
        );
        expect(await newDb.select(newDb.localExchange).get(), isEmpty);
        expect(await newDb.select(newDb.localExchangeEvidence).get(), isEmpty);
      },
    );
  });

  test('the v2 tables are usable by the app after upgrading from v1', () async {
    final schema = await verifier.schemaAt(1);
    final db = AppDatabase(schema.newConnection());
    final now = DateTime(2026, 9, 25, 8);
    await db
        .into(db.localExchange)
        .insert(
          LocalExchangeCompanion.insert(
            clientTransactionId: 'ctid-1',
            createIdempotencyKey: 'key-1',
            deviceId: 'device-1',
            createdAt: now,
            updatedAt: now,
          ),
        );
    final rows = await db.select(db.localExchange).get();
    expect(rows.single.serverExchangeId, isNull);
    final version = await db.customSelect('PRAGMA user_version').getSingle();
    expect(version.read<int>('user_version'), 2);
    await db.close();
  });
}
