import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/clock/server_clock.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/device_access_monitor.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

sealed class DeviceValidationState {
  const DeviceValidationState();
}

/// Not signed in or not provisioned: nothing to validate.
final class ValidationIdle extends DeviceValidationState {
  const ValidationIdle();
}

final class ValidationChecking extends DeviceValidationState {
  const ValidationChecking();
}

/// Device ACTIVE; context from a fresh bootstrap or, offline, from the cache.
final class ValidationPassed extends DeviceValidationState {
  const ValidationPassed(this.context, {this.fromCache = false});

  final DeviceContextSnapshot context;
  final bool fromCache;
}

/// FR-MOB-002 "LOGIN BLOCKED": `INACTIVE` or `REVOKED`.
final class ValidationBlocked extends DeviceValidationState {
  const ValidationBlocked(this.status);

  final DeviceStatus status;
}

/// This user may not operate this device (no `MOBILE_OPERATE`, or the
/// device's factory/location is outside the user's scope).
final class ValidationAccessDenied extends DeviceValidationState {
  const ValidationAccessDenied(this.error);

  final AppError error;
}

/// Never bootstrapped and the backend cannot be reached.
final class ValidationUnavailable extends DeviceValidationState {
  const ValidationUnavailable(this.error);

  final AppError error;
}

/// Validates the device right after login and at every start (FR-MOB-002,
/// MG-14: `/auth/login` does not check the device), and reacts to a
/// `DEVICE_INACTIVE` / `DEVICE_NOT_FOUND` answer on any later request.
class DeviceValidationController extends Notifier<DeviceValidationState> {
  int _generation = 0;

  @override
  DeviceValidationState build() {
    final generation = ++_generation;
    final signedIn = ref.watch(
      sessionControllerProvider.select((s) => s is SignedIn),
    );
    final deviceId = ref.watch(
      provisioningControllerProvider.select(
        (s) => s is Provisioned ? s.device.deviceId : null,
      ),
    );
    if (!signedIn || deviceId == null) return const ValidationIdle();

    final subscription = ref
        .watch(deviceAccessMonitorProvider)
        .events
        .listen(_onDeviceAccess);
    ref.onDispose(subscription.cancel);

    // Back online: replace a cached context (or an "unavailable" screen) with
    // a fresh bootstrap.
    ref.listen(connectivityStatusProvider, (previous, next) {
      final wasOffline = previous?.value != ConnectivityStatus.online;
      final current = state;
      if (wasOffline &&
          next.value == ConnectivityStatus.online &&
          (current is ValidationUnavailable ||
              (current is ValidationPassed && current.fromCache))) {
        unawaited(validate());
      }
    });

    unawaited(
      Future.microtask(() async {
        if (generation == _generation) await validate();
      }),
    );
    return const ValidationChecking();
  }

  /// `GET /mobile/bootstrap`, falling back to the cache when unreachable.
  Future<void> validate() async {
    final generation = _generation;
    bool stale() => !ref.mounted || generation != _generation;

    if (state is! ValidationPassed) state = const ValidationChecking();
    final repository = ref.read(bootstrapRepositoryProvider);
    final outcome = await repository.bootstrap();
    if (stale()) return;

    switch (outcome) {
      case BootstrapSucceeded(:final context):
        ref
            .read(serverClockProvider.notifier)
            .observe(context.serverTime, context.fetchedAt);
        ref
            .read(provisioningControllerProvider.notifier)
            .updateCode(context.device.code);
        state = ValidationPassed(context);
      case BootstrapDeviceBlocked(:final status):
        state = ValidationBlocked(status);
      case BootstrapDeviceNotRegistered():
        await _forgetDevice();
      case BootstrapAccessDenied(:final error):
        state = ValidationAccessDenied(error);
      case BootstrapUnavailable(:final error):
        final cached = await repository.cached();
        if (stale()) return;
        final lastStatus = cached.lastKnownStatus;
        final context = cached.context;
        if (lastStatus != null && lastStatus.isBlocked) {
          state = ValidationBlocked(lastStatus);
        } else if (context != null) {
          state = ValidationPassed(context, fromCache: true);
        } else {
          state = ValidationUnavailable(error);
        }
    }
  }

  void _onDeviceAccess(DeviceAccessEvent event) {
    switch (event) {
      case DeviceAccessInactive(:final status):
        final blocked = DeviceStatus.fromWire(status);
        final effective = blocked.isBlocked ? blocked : DeviceStatus.inactive;
        unawaited(
          ref.read(bootstrapRepositoryProvider).recordStatus(effective),
        );
        state = ValidationBlocked(effective);
      case DeviceAccessNotFound():
        unawaited(_forgetDevice());
    }
  }

  /// A heartbeat can report a non-ACTIVE status in a 200 answer too.
  void reportStatus(DeviceStatus status) {
    if (!status.isBlocked) return;
    unawaited(ref.read(bootstrapRepositoryProvider).recordStatus(status));
    state = ValidationBlocked(status);
  }

  bool _forgetting = false;

  /// `DEVICE_NOT_FOUND` → back to provisioning (MG-1 / MG-14). The same
  /// answer arrives twice (bootstrap outcome and access monitor); reset once.
  Future<void> _forgetDevice() async {
    if (_forgetting) return;
    _forgetting = true;
    try {
      await ref
          .read(provisioningControllerProvider.notifier)
          .reset(notice: AppStrings.deviceNotRegisteredNotice);
    } finally {
      _forgetting = false;
    }
  }
}

final deviceValidationControllerProvider =
    NotifierProvider<DeviceValidationController, DeviceValidationState>(
      DeviceValidationController.new,
    );
