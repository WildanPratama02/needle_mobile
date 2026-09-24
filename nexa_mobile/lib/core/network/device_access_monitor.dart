import 'dart:async';

import 'package:nexa_mobile/core/error/app_error.dart';

/// What any tablet request learned about this device's standing.
sealed class DeviceAccessEvent {
  const DeviceAccessEvent();
}

/// `403 DEVICE_INACTIVE`: `error.context.status` is `INACTIVE` or `REVOKED`.
final class DeviceAccessInactive extends DeviceAccessEvent {
  const DeviceAccessInactive(this.status);

  /// Raw backend status (`INACTIVE` / `REVOKED`), or `null` when absent.
  final String? status;
}

/// `404 DEVICE_NOT_FOUND`: the stored device id is unknown to the backend.
final class DeviceAccessNotFound extends DeviceAccessEvent {
  const DeviceAccessNotFound();
}

/// The device context is re-checked on every tablet request (Docs/12 §9), so
/// a revoke can surface on any call — bootstrap, heartbeat, later sync. The
/// [ApiClient] reports every failure here; the device-validation feature
/// listens and blocks the app (FR-MOB-002).
class DeviceAccessMonitor {
  final _controller = StreamController<DeviceAccessEvent>.broadcast();

  Stream<DeviceAccessEvent> get events => _controller.stream;

  void report(AppError error) {
    switch (error.code) {
      case BackendErrorCodes.deviceInactive:
        final status = error.context['status'];
        _controller.add(DeviceAccessInactive(status is String ? status : null));
      case BackendErrorCodes.deviceNotFound:
        _controller.add(const DeviceAccessNotFound());
    }
  }

  Future<void> dispose() => _controller.close();
}
