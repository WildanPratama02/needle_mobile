import 'package:drift/drift.dart';

// Table names follow the conceptual local tables of Doc 07 §38. Schema v1 holds
// only what Phase 3 needs; see Docs/22 §5. No credentials here — tokens and the
// device id live in flutter_secure_storage.

/// The signed-in user plus the last `GET /auth/me` answer. One row.
@DataClassName('UserSessionRow')
class LocalUserSession extends Table {
  @override
  String get tableName => 'local_user_session';

  IntColumn get slot => integer().withDefault(const Constant(0))();
  TextColumn get userId => text()();
  TextColumn get username => text()();
  TextColumn get name => text()();

  /// JSON arrays of strings.
  TextColumn get roles => text()();
  TextColumn get permissions => text().withDefault(const Constant('[]'))();
  TextColumn get factoryIds => text().withDefault(const Constant('[]'))();
  TextColumn get locationIds => text().withDefault(const Constant('[]'))();
  BoolColumn get profileLoaded =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {slot};
}

/// Device, factory and trolley from the last successful `GET /mobile/bootstrap`.
/// One row.
@DataClassName('DeviceContextRow')
class LocalDeviceContext extends Table {
  @override
  String get tableName => 'local_device_context';

  IntColumn get slot => integer().withDefault(const Constant(0))();
  TextColumn get deviceId => text()();
  TextColumn get deviceCode => text()();
  TextColumn get deviceName => text()();
  TextColumn get factoryId => text()();
  TextColumn get factoryCode => text()();
  TextColumn get factoryName => text()();
  TextColumn get factoryTimezone => text()();
  TextColumn get trolleyId => text()();
  TextColumn get trolleyCode => text()();
  TextColumn get trolleyName => text()();
  TextColumn get trolleyLocationId => text()();
  DateTimeColumn get serverTime => dateTime()();
  TextColumn get syncCursor => text()();

  /// Local time the bootstrap answer arrived — drives the "cached since" hint.
  DateTimeColumn get fetchedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {slot};
}

/// The last device status the backend reported (bootstrap or any
/// `DEVICE_INACTIVE` answer), so an offline start stays blocked (contract
/// matrix `device_context` row: "blocked if last answer was inactive"). One row.
@DataClassName('DeviceValidationRow')
class LocalDeviceValidation extends Table {
  @override
  String get tableName => 'local_device_validation';

  IntColumn get slot => integer().withDefault(const Constant(0))();
  TextColumn get deviceId => text()();

  /// `ACTIVE` / `INACTIVE` / `REVOKED`.
  TextColumn get status => text()();
  DateTimeColumn get checkedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {slot};
}

@DataClassName('NeedleTypeRow')
class LocalNeedleType extends Table {
  @override
  String get tableName => 'local_needle_type';

  TextColumn get id => text()();
  TextColumn get code => text()();
  TextColumn get name => text()();
  TextColumn get category => text().nullable()();
  TextColumn get unit => text()();

  /// Decimal as a string, exactly as the backend sends it.
  TextColumn get minimumStock => text()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

@DataClassName('ExchangeTypeRow')
class LocalExchangeType extends Table {
  @override
  String get tableName => 'local_exchange_type';

  TextColumn get id => text()();
  TextColumn get code => text()();
  TextColumn get name => text()();
  BoolColumn get requiresFragmentValidation => boolean()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

@DataClassName('StorageMappingRow')
class LocalStorageMapping extends Table {
  @override
  String get tableName => 'local_storage_mapping';

  TextColumn get id => text()();
  TextColumn get exchangeTypeId => text()();
  TextColumn get storageLocationId => text()();
  TextColumn get storageLocationCode => text()();
  TextColumn get storageLocationName => text()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Version string per master-data collection (`needleTypes`, `exchangeTypes`,
/// `storageMappings`), sent back on the next bootstrap (Doc 15 §17).
@DataClassName('MasterDataVersionRow')
class LocalMasterDataVersion extends Table {
  @override
  String get tableName => 'local_master_data_version';

  TextColumn get collection => text()();
  TextColumn get version => text()();

  @override
  Set<Column<Object>> get primaryKey => {collection};
}

// ---------------------------------------------------------------------------
// Schema v2 (Phase 6–8, online exchange flow). Only what resuming an
// interrupted exchange needs — NOT the Phase 9 sync queue (`local_sync_queue`
// lands later with its own migration, Docs/22 §5).
// ---------------------------------------------------------------------------

/// The one unfinished exchange of this tablet, so a killed app resumes at the
/// server's state (Doc 17 §40 "do not lose a transaction draft").
///
/// This is a pointer to the server record, not a copy of it: the step to show
/// is always re-derived from `GET /exchanges/{id}` (the backend is
/// authoritative, ADR-004). [lastKnownStatus] is a hint for logs only.
/// The row is deleted once the server reports `COMPLETED` or `CANCELLED`.
@DataClassName('LocalExchangeRow')
class LocalExchange extends Table {
  @override
  String get tableName => 'local_exchange';

  /// Client-generated, sent on `POST /exchanges` (UNIQUE per device on the
  /// backend, so a resend returns the original exchange — MG-12).
  TextColumn get clientTransactionId => text()();

  /// The `Idempotency-Key` of the create attempt, reused when the create is
  /// resent after the app was killed before the answer arrived.
  TextColumn get createIdempotencyKey => text()();

  /// Device the exchange was opened from; a row of another device (after
  /// re-provisioning) is never resumed.
  TextColumn get deviceId => text()();

  /// `null` until `POST /exchanges` answered.
  TextColumn get serverExchangeId => text().nullable()();
  TextColumn get exchangeNumber => text().nullable()();
  TextColumn get lastKnownStatus => text().nullable()();

  /// Operator shown after the RFID lookup — the exchange row carries only
  /// `operatorId` (contract matrix MG-4), so a resumed summary needs these.
  TextColumn get operatorEmployeeNumber => text().nullable()();
  TextColumn get operatorName => text().nullable()();

  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {clientTransactionId};
}

/// A captured evidence photo kept on the tablet until the backend confirmed
/// the upload (Doc 17 §20, contract matrix MG-7). Named after the domain term
/// Evidence (CONTEXT.md), Doc 07 §38's `local_exchange_photo`.
@DataClassName('LocalExchangeEvidenceRow')
class LocalExchangeEvidence extends Table {
  @override
  String get tableName => 'local_exchange_evidence';

  /// Local id (UUID).
  TextColumn get id => text()();
  TextColumn get clientTransactionId => text()();

  /// `OLD_NEEDLE` / `BROKEN_FRAGMENT` / `OTHER`.
  TextColumn get evidenceType => text()();
  TextColumn get filePath => text()();
  TextColumn get mimeType => text()();
  IntColumn get byteSize => integer()();
  DateTimeColumn get capturedAt => dateTime()();

  /// One key per photo, reused on every resend of that photo.
  TextColumn get idempotencyKey => text()();

  /// Local photo state (Doc 17 §48): `CAPTURED` / `UPLOAD_FAILED`. The row is
  /// deleted with its file once the upload is confirmed.
  TextColumn get uploadStatus => text()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
