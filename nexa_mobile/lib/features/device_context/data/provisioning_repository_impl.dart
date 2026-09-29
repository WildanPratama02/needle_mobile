import 'package:nexa_mobile/core/storage/provisioned_device_store.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_local_data_source.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';

class ProvisioningRepositoryImpl implements ProvisioningRepository {
  const ProvisioningRepositoryImpl({
    required this._store,
    required this._contextCache,
    required this._masterData,
  });

  final ProvisionedDeviceStore _store;
  final DeviceContextLocalDataSource _contextCache;
  final MasterDataRepository _masterData;

  @override
  Future<ProvisionedDevice?> current() async {
    final stored = await _store.read();
    return stored == null
        ? null
        : ProvisionedDevice(
            deviceId: stored.deviceId,
            deviceCode: stored.deviceCode,
          );
  }

  @override
  Future<void> save(ProvisionedDevice device) async {
    final previous = await _store.read();
    if (previous != null && previous.deviceId != device.deviceId) {
      // A different device record: nothing cached for the old one applies.
      await _clearCaches();
    }
    await _store.save(
      StoredDeviceIdentity(
        deviceId: device.deviceId,
        deviceCode: device.deviceCode,
      ),
    );
  }

  @override
  Future<void> clear() async {
    await _store.clear();
    await _clearCaches();
  }

  Future<void> _clearCaches() async {
    await _contextCache.clear();
    await _masterData.clear();
  }
}
