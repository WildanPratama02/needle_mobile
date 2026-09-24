import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';

/// How a device-context failure must be handled (FR-MOB-002, MG-14).
enum DeviceFailureKind {
  /// `403 DEVICE_INACTIVE` → login blocked.
  blocked,

  /// `404 DEVICE_NOT_FOUND` or `400 DEVICE_CONTEXT_REQUIRED` → provision again.
  notRegistered,

  /// `403 FORBIDDEN` / `FACTORY_SCOPE_DENIED` / `DEVICE_MISMATCH` → this user
  /// may not operate this device.
  accessDenied,

  /// No response, 5xx, 401 after a failed refresh, anything else → fall back
  /// to the cache when there is one.
  unavailable,
}

DeviceFailureKind classifyDeviceFailure(AppError error) => switch (error.code) {
  BackendErrorCodes.deviceInactive => DeviceFailureKind.blocked,
  BackendErrorCodes.deviceNotFound ||
  BackendErrorCodes.deviceContextRequired => DeviceFailureKind.notRegistered,
  BackendErrorCodes.forbidden ||
  BackendErrorCodes.authForbidden ||
  BackendErrorCodes.factoryScopeDenied ||
  BackendErrorCodes.deviceMismatch => DeviceFailureKind.accessDenied,
  _ => DeviceFailureKind.unavailable,
};

/// `error.context.status` of a `DEVICE_INACTIVE` answer.
DeviceStatus blockedStatusOf(AppError error) {
  final raw = error.context['status'];
  final status = DeviceStatus.fromWire(raw is String ? raw : null);
  // A DEVICE_INACTIVE without a readable status is still inactive.
  return status.isBlocked ? status : DeviceStatus.inactive;
}

sealed class BootstrapOutcome {
  const BootstrapOutcome();
}

final class BootstrapSucceeded extends BootstrapOutcome {
  const BootstrapSucceeded(this.context);

  final DeviceContextSnapshot context;
}

final class BootstrapDeviceBlocked extends BootstrapOutcome {
  const BootstrapDeviceBlocked(this.status);

  /// [DeviceStatus.inactive] or [DeviceStatus.revoked].
  final DeviceStatus status;
}

final class BootstrapDeviceNotRegistered extends BootstrapOutcome {
  const BootstrapDeviceNotRegistered();
}

final class BootstrapAccessDenied extends BootstrapOutcome {
  const BootstrapAccessDenied(this.error);

  final AppError error;
}

final class BootstrapUnavailable extends BootstrapOutcome {
  const BootstrapUnavailable(this.error);

  final AppError error;
}

/// What the tablet remembers from earlier bootstraps — used offline.
final class CachedDeviceState {
  const CachedDeviceState({this.context, this.lastKnownStatus});

  final DeviceContextSnapshot? context;

  /// Last status the backend reported for the provisioned device.
  final DeviceStatus? lastKnownStatus;
}

sealed class HeartbeatOutcome {
  const HeartbeatOutcome();
}

final class HeartbeatAccepted extends HeartbeatOutcome {
  const HeartbeatAccepted({
    required this.status,
    required this.serverTime,
    this.clockOffset,
  });

  final DeviceStatus status;
  final DateTime serverTime;

  /// `serverTime − deviceTime` (Doc 15 §18).
  final Duration? clockOffset;
}

final class HeartbeatFailed extends HeartbeatOutcome {
  const HeartbeatFailed(this.error);

  final AppError error;
}
