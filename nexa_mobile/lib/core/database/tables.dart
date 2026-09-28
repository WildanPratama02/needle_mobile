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
// Schema v2 (Phase 6–8, online exchange flow): resuming an interrupted
// exchange. Schema v3 (Phase 9) adds the sync queue and state below and the
// sync columns of `local_exchange` (Docs/22 §5).
// ---------------------------------------------------------------------------

/// This tablet's exchanges: the unfinished one the wizard resumes (Doc 17 §40
/// "do not lose a transaction draft"), and finished ones until their sync is
/// confirmed plus the retention period.
///
/// The step to show is derived from the last server answer
/// ([serverSnapshot], refreshed with `GET /exchanges/{id}` when online) plus
/// the steps still queued — the backend stays authoritative (ADR-004).
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

  // --- v3 (Phase 9, offline sync) -----------------------------------------

  /// The last exchange the backend returned (JSON, Docs/12 §10 shape), so an
  /// exchange can be resumed and its queued steps projected while offline.
  /// Replaced only by a newer server answer — never edited locally.
  TextColumn get serverSnapshot => text().nullable()();

  /// Confirmation status from sync results / pulls / `GET /confirmations`
  /// (`PENDING`/`APPROVED`/`REJECTED`/`EXPIRED`; `null` = not required or not
  /// known yet).
  TextColumn get confirmationStatus => text().nullable()();

  /// The PIC queued complete/cancel, or the server reported a terminal state:
  /// the wizard does not resume it by itself.
  DateTimeColumn get closedAt => dateTime().nullable()();

  /// Terminal on the server and nothing left to send: start of the 7-day
  /// local retention (nexa_mobile/CLAUDE.md §2).
  DateTimeColumn get syncConfirmedAt => dateTime().nullable()();

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

// ---------------------------------------------------------------------------
// Schema v3 (Phase 9, offline sync — Doc 15 §9–14, Docs/12 §19).
// ---------------------------------------------------------------------------

/// The command queue (Doc 07 §38 `local_sync_queue`, Doc 15 §9): one row per
/// exchange step taken on the tablet and sent through `POST /mobile/sync`.
/// A rejection keeps its error here (Doc 07 §38 `local_sync_error`).
@DataClassName('LocalSyncQueueRow')
class LocalSyncQueue extends Table {
  @override
  String get tableName => 'local_sync_queue';

  /// Creation order = send order (per exchange strictly, Doc 15 §12).
  IntColumn get sequence => integer().autoIncrement()();

  /// UUID, the command's idempotency key; generated once, never regenerated
  /// on retry.
  TextColumn get commandId => text().unique()();

  /// The exchange's key (the one `POST /exchanges` carried).
  TextColumn get clientTransactionId => text()();
  TextColumn get commandType => text()();

  /// JSON object, exactly the backend payload.
  TextColumn get payload => text().withDefault(const Constant('{}'))();

  /// Device time the PIC took the step (audit metadata on the backend).
  DateTimeColumn get occurredAt => dateTime()();

  /// `QUEUED` / `ACCEPTED` / `REJECTED`.
  TextColumn get status => text()();

  /// Technical failures so far (Doc 15 §9 `retryCount`).
  IntColumn get attemptCount => integer().withDefault(const Constant(0))();

  /// Earliest automatic resend after a technical failure (Doc 15 §14).
  DateTimeColumn get nextAttemptAt => dateTime().nullable()();

  /// Wire status of the last answer, or `NETWORK`.
  TextColumn get lastResult => text().nullable()();
  TextColumn get lastErrorCode => text().nullable()();
  TextColumn get lastErrorMessage => text().nullable()();

  /// JSON object: `error.context` (e.g. `availableQuantity`).
  TextColumn get lastErrorContext => text().nullable()();

  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
}

/// Pull cursor and last successful sync. One row.
@DataClassName('LocalSyncStateRow')
class LocalSyncState extends Table {
  @override
  String get tableName => 'local_sync_state';

  IntColumn get slot => integer().withDefault(const Constant(0))();

  /// The device the cursor belongs to.
  TextColumn get deviceId => text()();

  /// Opaque `nextCursor` of the last answered sync; `null` → start from the
  /// bootstrap `syncCursor`.
  TextColumn get cursor => text().nullable()();

  /// Local time of the last sync the backend answered ("Last sync HH:mm",
  /// Doc 15 §19).
  DateTimeColumn get lastSyncAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {slot};
}

// ---------------------------------------------------------------------------
// Schema v4 (Phase 10, trolley stock view — FR-MOB-015, contract matrix
// "Trolley stock view": offline shows the last cached copy, marked stale).
// ---------------------------------------------------------------------------

/// The last `GET /inventory/trolleys/{trolleyId}` answer per trolley. One
/// row per trolley, replaced whole on every successful read.
///
/// A display cache only (ADR-004): never a stock balance the tablet decides
/// with. Items are stored exactly as the backend sent them (JSON of
/// `data.items`); display names are joined from the needle-type cache when
/// read, like the online path.
@DataClassName('TrolleyStockCacheRow')
class LocalTrolleyStock extends Table {
  @override
  String get tableName => 'local_trolley_stock';

  TextColumn get trolleyId => text()();

  /// JSON array: `data.items` of the answer (may be empty).
  TextColumn get items => text()();

  /// Local time the answer arrived — shown as "saved at" when stale.
  DateTimeColumn get fetchedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {trolleyId};
}
