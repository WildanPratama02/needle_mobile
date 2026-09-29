/// Device state as FR-MOB-002 names it. `UNKNOWN` covers "never validated"
/// and any value this build does not recognise.
enum DeviceStatus {
  active,
  inactive,
  revoked,
  unknown;

  static DeviceStatus fromWire(String? value) => switch (value) {
    'ACTIVE' => DeviceStatus.active,
    'INACTIVE' => DeviceStatus.inactive,
    'REVOKED' => DeviceStatus.revoked,
    _ => DeviceStatus.unknown,
  };

  String get wire => name.toUpperCase();

  bool get isBlocked =>
      this == DeviceStatus.inactive || this == DeviceStatus.revoked;
}

/// The identity learned at provisioning (MG-1). [deviceCode] is known after a
/// QR scan or the first bootstrap; manual entry starts without it.
final class ProvisionedDevice {
  const ProvisionedDevice({required this.deviceId, this.deviceCode});

  final String deviceId;
  final String? deviceCode;
}

final class DeviceInfo {
  const DeviceInfo({
    required this.id,
    required this.code,
    required this.name,
    required this.status,
  });

  final String id;
  final String code;
  final String name;
  final DeviceStatus status;
}

final class FactoryInfo {
  const FactoryInfo({
    required this.id,
    required this.code,
    required this.name,
    required this.timezone,
  });

  final String id;
  final String code;
  final String name;
  final String timezone;
}

final class TrolleyInfo {
  const TrolleyInfo({
    required this.id,
    required this.code,
    required this.name,
    required this.locationId,
  });

  final String id;
  final String code;
  final String name;
  final String locationId;
}

/// Device / factory / trolley binding from bootstrap (Doc 07 §4: context comes
/// from the backend, never chosen by the PIC).
final class DeviceContextSnapshot {
  const DeviceContextSnapshot({
    required this.device,
    required this.factory,
    required this.trolley,
    required this.serverTime,
    required this.syncCursor,
    required this.fetchedAt,
  });

  final DeviceInfo device;
  final FactoryInfo factory;
  final TrolleyInfo trolley;
  final DateTime serverTime;

  /// Opaque; the first `POST /mobile/sync` starts from it (Phase 9).
  final String syncCursor;

  /// Local time the answer arrived.
  final DateTime fetchedAt;
}
