import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';

/// `local_device_context` and `local_device_validation` (one row each).
class DeviceContextLocalDataSource {
  const DeviceContextLocalDataSource(this._db);

  final AppDatabase _db;

  Future<DeviceContextSnapshot?> readContext() async {
    final r = await _db.select(_db.localDeviceContext).getSingleOrNull();
    if (r == null) return null;
    final status = await readStatus(r.deviceId);
    return DeviceContextSnapshot(
      device: DeviceInfo(
        id: r.deviceId,
        code: r.deviceCode,
        name: r.deviceName,
        status: status ?? DeviceStatus.unknown,
      ),
      factory: FactoryInfo(
        id: r.factoryId,
        code: r.factoryCode,
        name: r.factoryName,
        timezone: r.factoryTimezone,
      ),
      trolley: TrolleyInfo(
        id: r.trolleyId,
        code: r.trolleyCode,
        name: r.trolleyName,
        locationId: r.trolleyLocationId,
      ),
      serverTime: r.serverTime,
      syncCursor: r.syncCursor,
      fetchedAt: r.fetchedAt,
    );
  }

  Future<void> writeContext(DeviceContextSnapshot c) => _db
      .into(_db.localDeviceContext)
      .insertOnConflictUpdate(
        LocalDeviceContextCompanion.insert(
          slot: const Value(0),
          deviceId: c.device.id,
          deviceCode: c.device.code,
          deviceName: c.device.name,
          factoryId: c.factory.id,
          factoryCode: c.factory.code,
          factoryName: c.factory.name,
          factoryTimezone: c.factory.timezone,
          trolleyId: c.trolley.id,
          trolleyCode: c.trolley.code,
          trolleyName: c.trolley.name,
          trolleyLocationId: c.trolley.locationId,
          serverTime: c.serverTime,
          syncCursor: c.syncCursor,
          fetchedAt: c.fetchedAt,
        ),
      );

  /// Status of [deviceId]; `null` when none is stored or it belongs to another
  /// device id.
  Future<DeviceStatus?> readStatus(String deviceId) async {
    final r = await _db.select(_db.localDeviceValidation).getSingleOrNull();
    if (r == null || r.deviceId != deviceId) return null;
    return DeviceStatus.fromWire(r.status);
  }

  Future<void> writeStatus(String deviceId, DeviceStatus status) => _db
      .into(_db.localDeviceValidation)
      .insertOnConflictUpdate(
        LocalDeviceValidationCompanion.insert(
          slot: const Value(0),
          deviceId: deviceId,
          status: status.wire,
          checkedAt: DateTime.now(),
        ),
      );

  Future<void> clear() => _db.transaction(() async {
    await _db.delete(_db.localDeviceContext).go();
    await _db.delete(_db.localDeviceValidation).go();
  });
}
