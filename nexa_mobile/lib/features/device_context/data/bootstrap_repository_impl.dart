import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/storage/provisioned_device_store.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_local_data_source.dart';
import 'package:nexa_mobile/features/device_context/data/device_remote_data_source.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';

class BootstrapRepositoryImpl implements BootstrapRepository {
  BootstrapRepositoryImpl({
    required this._remote,
    required this._local,
    required this._masterData,
    required this._deviceStore,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final DeviceRemoteDataSource _remote;
  final DeviceContextLocalDataSource _local;
  final MasterDataRepository _masterData;
  final ProvisionedDeviceStore _deviceStore;
  final DateTime Function() _now;

  @override
  Future<BootstrapOutcome> bootstrap() async {
    final held = await _masterData.storedVersions();
    final result = await _remote.bootstrap(held);
    switch (result) {
      case ApiFailure(:final error):
        switch (classifyDeviceFailure(error)) {
          case DeviceFailureKind.blocked:
            final status = blockedStatusOf(error);
            await recordStatus(status);
            return BootstrapDeviceBlocked(status);
          case DeviceFailureKind.notRegistered:
            return const BootstrapDeviceNotRegistered();
          case DeviceFailureKind.accessDenied:
            return BootstrapAccessDenied(error);
          case DeviceFailureKind.unavailable:
            return BootstrapUnavailable(error);
        }
      case ApiSuccess(:final data):
        final snapshot = DeviceContextSnapshot(
          device: data.device,
          factory: data.factory,
          trolley: data.trolley,
          serverTime: data.serverTime,
          syncCursor: data.syncCursor,
          fetchedAt: _now(),
        );
        await _masterData.apply(sent: held, received: data.masterData);
        await _local.writeContext(snapshot);
        await _local.writeStatus(data.device.id, data.device.status);
        // Keep the stored code in step (manual entry starts without one).
        final stored = await _deviceStore.read();
        if (stored != null &&
            stored.deviceId == data.device.id &&
            stored.deviceCode != data.device.code) {
          await _deviceStore.save(
            StoredDeviceIdentity(
              deviceId: stored.deviceId,
              deviceCode: data.device.code,
            ),
          );
        }
        AppLogger.info('device', 'bootstrap ok (${data.device.status.wire})');
        // Bootstrap only succeeds for an ACTIVE device (Docs/12 §9), but do
        // not trust that blindly.
        if (data.device.status.isBlocked) {
          return BootstrapDeviceBlocked(data.device.status);
        }
        return BootstrapSucceeded(snapshot);
    }
  }

  @override
  Future<CachedDeviceState> cached() async {
    final deviceId = await _deviceStore.readDeviceId();
    if (deviceId == null) return const CachedDeviceState();
    final context = await _local.readContext();
    return CachedDeviceState(
      context: context?.device.id == deviceId ? context : null,
      lastKnownStatus: await _local.readStatus(deviceId),
    );
  }

  @override
  Future<void> recordStatus(DeviceStatus status) async {
    final deviceId = await _deviceStore.readDeviceId();
    if (deviceId != null) await _local.writeStatus(deviceId, status);
  }
}
