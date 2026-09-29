import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';

/// Which part of the app may be shown. Order follows Doc 17 §43
/// (Launch → Device Check → Authentication → Trolley/Factory Validation →
/// Bootstrap → Home), with provisioning as the device check (MG-1).
enum AppGate {
  /// Reading secure storage.
  starting,

  /// No device id stored.
  provisioning,

  /// No session.
  login,

  /// Signed in, bootstrap running.
  validating,

  /// Blocked, access denied, or never bootstrapped and offline.
  blocked,

  /// Device validated; transactions allowed.
  ready,
}

/// Pure: the router's redirect is driven only by this.
AppGate resolveAppGate({
  required ProvisioningState provisioning,
  required SessionState session,
  required DeviceValidationState validation,
}) {
  if (provisioning is ProvisioningLoading) return AppGate.starting;
  if (provisioning is Unprovisioned) return AppGate.provisioning;
  return switch (session) {
    SessionRestoring() => AppGate.starting,
    SignedOut() => AppGate.login,
    SignedIn() => switch (validation) {
      ValidationIdle() || ValidationChecking() => AppGate.validating,
      ValidationPassed() => AppGate.ready,
      ValidationBlocked() ||
      ValidationAccessDenied() ||
      ValidationUnavailable() => AppGate.blocked,
    },
  };
}

final appGateProvider = Provider<AppGate>(
  (ref) => resolveAppGate(
    provisioning: ref.watch(provisioningControllerProvider),
    session: ref.watch(sessionControllerProvider),
    validation: ref.watch(deviceValidationControllerProvider),
  ),
);
