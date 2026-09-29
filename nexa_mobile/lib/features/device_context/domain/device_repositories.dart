import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';

/// The device identity stored at provisioning (MG-1).
abstract interface class ProvisioningRepository {
  Future<ProvisionedDevice?> current();

  Future<void> save(ProvisionedDevice device);

  /// Clears the stored id and every device-bound cache (context, validation
  /// status, master data).
  Future<void> clear();
}

/// `GET /mobile/bootstrap` plus its local cache (FR-MOB-002, Doc 15 §16).
abstract interface class BootstrapRepository {
  /// Online bootstrap with the stored master-data versions. Persists the
  /// context, the device status and the master data on success; records a
  /// blocked status on `DEVICE_INACTIVE`.
  Future<BootstrapOutcome> bootstrap();

  Future<CachedDeviceState> cached();

  /// Remembers a status learned outside bootstrap (heartbeat, any request).
  Future<void> recordStatus(DeviceStatus status);
}

/// `POST /devices/{id}/heartbeat` (Docs/12 §9).
abstract interface class HeartbeatRepository {
  Future<HeartbeatOutcome> send({
    required String deviceId,
    required String appVersion,
    required DateTime deviceTime,
  });
}
