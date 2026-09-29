// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift_dev/api/migrations_native.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:flutter_test/flutter_test.dart';

import 'generated/schema.dart';

import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;
import 'generated/schema_v3.dart' as v3;
import 'generated/schema_v4.dart' as v4;

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
    expect(version.read<int>('user_version'), db.schemaVersion);
    await db.close();
  });

  // v2 → v3 (Phase 9) is additive: an exchange left unfinished under v2 —
  // and its kept photo — must survive the upgrade and still resume; the new
  // sync columns start empty; the queue and sync state start empty.
  test('migration from v2 to v3 keeps an unfinished exchange and its photo, '
      'new columns start empty', () async {
    const exchangeV2 = v2.LocalExchangeData(
      clientTransactionId: 'ctid-1',
      createIdempotencyKey: 'key-1',
      deviceId: 'device-1',
      serverExchangeId: 'e1',
      exchangeNumber: 'EXC-1',
      lastKnownStatus: 'EXCHANGE_TYPE_SELECTED',
      operatorEmployeeNumber: 'EMP001',
      operatorName: 'Siti',
      createdAt: 1758700000,
      updatedAt: 1758700100,
    );
    const exchangeV3 = v3.LocalExchangeData(
      clientTransactionId: 'ctid-1',
      createIdempotencyKey: 'key-1',
      deviceId: 'device-1',
      serverExchangeId: 'e1',
      exchangeNumber: 'EXC-1',
      lastKnownStatus: 'EXCHANGE_TYPE_SELECTED',
      operatorEmployeeNumber: 'EMP001',
      operatorName: 'Siti',
      createdAt: 1758700000,
      updatedAt: 1758700100,
    );
    const photoV2 = v2.LocalExchangeEvidenceData(
      id: 'ev-1',
      clientTransactionId: 'ctid-1',
      evidenceType: 'OLD_NEEDLE',
      filePath: '/data/evidence/ctid-1/ev-1.jpg',
      mimeType: 'image/jpeg',
      byteSize: 1234,
      capturedAt: 1758700050,
      idempotencyKey: 'photo-key',
      uploadStatus: 'UPLOAD_FAILED',
    );
    const photoV3 = v3.LocalExchangeEvidenceData(
      id: 'ev-1',
      clientTransactionId: 'ctid-1',
      evidenceType: 'OLD_NEEDLE',
      filePath: '/data/evidence/ctid-1/ev-1.jpg',
      mimeType: 'image/jpeg',
      byteSize: 1234,
      capturedAt: 1758700050,
      idempotencyKey: 'photo-key',
      uploadStatus: 'UPLOAD_FAILED',
    );

    await verifier.testWithDataIntegrity(
      oldVersion: 2,
      newVersion: 3,
      createOld: v2.DatabaseAtV2.new,
      createNew: v3.DatabaseAtV3.new,
      openTestedDatabase: AppDatabase.new,
      createItems: (batch, oldDb) {
        batch
          ..insert(oldDb.localExchange, exchangeV2)
          ..insert(oldDb.localExchangeEvidence, photoV2);
      },
      validateItems: (newDb) async {
        expect(await newDb.select(newDb.localExchange).get(), [exchangeV3]);
        expect(await newDb.select(newDb.localExchangeEvidence).get(), [
          photoV3,
        ]);
        expect(await newDb.select(newDb.localSyncQueue).get(), isEmpty);
        expect(await newDb.select(newDb.localSyncState).get(), isEmpty);
      },
    );
  });

  test('after upgrading from v2 the app resumes the old exchange and can '
      'queue its next step', () async {
    final schema = await verifier.schemaAt(2);
    final old = v2.DatabaseAtV2(schema.newConnection());
    await old
        .into(old.localExchange)
        .insert(
          const v2.LocalExchangeData(
            clientTransactionId: 'ctid-1',
            createIdempotencyKey: 'key-1',
            deviceId: 'device-1',
            serverExchangeId: 'e1',
            lastKnownStatus: 'OPERATOR_IDENTIFIED',
            createdAt: 1758700000,
            updatedAt: 1758700000,
          ),
        );
    final db = AppDatabase(schema.newConnection());
    final row = await db.select(db.localExchange).getSingle();
    expect(row.serverSnapshot, isNull);
    expect(row.closedAt, isNull);
    expect(row.syncConfirmedAt, isNull);
    final now = DateTime(2026, 9, 28, 8);
    await db
        .into(db.localSyncQueue)
        .insert(
          LocalSyncQueueCompanion.insert(
            commandId: 'cmd-1',
            clientTransactionId: 'ctid-1',
            commandType: 'SELECT_EXCHANGE_TYPE',
            occurredAt: now,
            status: 'QUEUED',
            createdAt: now,
            updatedAt: now,
          ),
        );
    final queued = await db.select(db.localSyncQueue).getSingle();
    expect(queued.sequence, 1);
    expect(queued.payload, '{}');
    expect(queued.attemptCount, 0);
    final version = await db.customSelect('PRAGMA user_version').getSingle();
    expect(version.read<int>('user_version'), db.schemaVersion);
    await db.close();
  });

  // v3 → v4 (Phase 10) is additive: an exchange with a queued step and the
  // sync checkpoint survive untouched; the stock cache starts empty and is
  // writable (FR-MOB-015 offline copy).
  test('migration from v3 to v4 keeps exchanges and the queue, the stock '
      'cache starts empty and works', () async {
    const exchangeV3 = v3.LocalExchangeData(
      clientTransactionId: 'ctid-1',
      createIdempotencyKey: 'key-1',
      deviceId: 'device-1',
      serverExchangeId: 'e1',
      exchangeNumber: 'EXC-1',
      lastKnownStatus: 'NEW_NEEDLE_SELECTED',
      operatorEmployeeNumber: 'EMP001',
      operatorName: 'Siti',
      createdAt: 1758700000,
      updatedAt: 1758700100,
      serverSnapshot: '{"id":"e1"}',
      confirmationStatus: 'APPROVED',
    );
    const exchangeV4 = v4.LocalExchangeData(
      clientTransactionId: 'ctid-1',
      createIdempotencyKey: 'key-1',
      deviceId: 'device-1',
      serverExchangeId: 'e1',
      exchangeNumber: 'EXC-1',
      lastKnownStatus: 'NEW_NEEDLE_SELECTED',
      operatorEmployeeNumber: 'EMP001',
      operatorName: 'Siti',
      createdAt: 1758700000,
      updatedAt: 1758700100,
      serverSnapshot: '{"id":"e1"}',
      confirmationStatus: 'APPROVED',
    );
    const commandV3 = v3.LocalSyncQueueData(
      sequence: 1,
      commandId: 'cmd-1',
      clientTransactionId: 'ctid-1',
      commandType: 'ISSUE_NEEDLE',
      payload: '{}',
      occurredAt: 1758700200,
      status: 'QUEUED',
      attemptCount: 0,
      createdAt: 1758700200,
      updatedAt: 1758700200,
    );
    const commandV4 = v4.LocalSyncQueueData(
      sequence: 1,
      commandId: 'cmd-1',
      clientTransactionId: 'ctid-1',
      commandType: 'ISSUE_NEEDLE',
      payload: '{}',
      occurredAt: 1758700200,
      status: 'QUEUED',
      attemptCount: 0,
      createdAt: 1758700200,
      updatedAt: 1758700200,
    );

    await verifier.testWithDataIntegrity(
      oldVersion: 3,
      newVersion: 4,
      createOld: v3.DatabaseAtV3.new,
      createNew: v4.DatabaseAtV4.new,
      openTestedDatabase: AppDatabase.new,
      createItems: (batch, oldDb) {
        batch
          ..insert(oldDb.localExchange, exchangeV3)
          ..insert(oldDb.localSyncQueue, commandV3);
      },
      validateItems: (newDb) async {
        expect(await newDb.select(newDb.localExchange).get(), [exchangeV4]);
        expect(await newDb.select(newDb.localSyncQueue).get(), [commandV4]);
        expect(await newDb.select(newDb.localTrolleyStock).get(), isEmpty);
      },
    );

    final schema = await verifier.schemaAt(3);
    final db = AppDatabase(schema.newConnection());
    await db
        .into(db.localTrolleyStock)
        .insert(
          LocalTrolleyStockCompanion.insert(
            trolleyId: 'trolley-1',
            items: '[]',
            fetchedAt: DateTime(2026, 9, 28, 8),
          ),
        );
    expect((await db.select(db.localTrolleyStock).getSingle()).items, '[]');
    final version = await db.customSelect('PRAGMA user_version').getSingle();
    expect(version.read<int>('user_version'), 4);
    await db.close();
  });
}
