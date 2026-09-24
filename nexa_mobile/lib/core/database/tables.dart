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
