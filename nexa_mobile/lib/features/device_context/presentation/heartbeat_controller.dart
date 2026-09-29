import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/app_info/app_info.dart';
import 'package:nexa_mobile/core/clock/server_clock.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';

/// `POST /devices/{id}/heartbeat` on start, on resume, and every
/// `HEARTBEAT_INTERVAL_SECONDS` while online and validated (Docs/12 §9,
/// Doc 15 §18). A `DEVICE_INACTIVE` answer reaches
/// [DeviceValidationController] through the device-access monitor and blocks
/// the app. State: time of the last accepted heartbeat.
class HeartbeatController extends Notifier<DateTime?> {
  @override
  DateTime? build() {
    final validated = ref.watch(
      deviceValidationControllerProvider.select((s) => s is ValidationPassed),
    );
    final deviceId = ref.watch(
      provisioningControllerProvider.select(
        (s) => s is Provisioned ? s.device.deviceId : null,
      ),
    );
    final online = ref.watch(
      connectivityStatusProvider.select(
        (s) => s.value == ConnectivityStatus.online,
      ),
    );
    if (!validated || deviceId == null || !online) return null;

    final interval = ref.watch(appConfigProvider).heartbeatInterval;
    final timer = Timer.periodic(interval, (_) => unawaited(beat()));
    final lifecycle = AppLifecycleListener(onResume: () => unawaited(beat()));
    ref.onDispose(() {
      timer.cancel();
      lifecycle.dispose();
    });
    unawaited(Future.microtask(beat));
    return null;
  }

  bool _inFlight = false;

  Future<void> beat() async {
    if (_inFlight) return;
    final deviceState = ref.read(provisioningControllerProvider);
    if (deviceState is! Provisioned) return;
    _inFlight = true;
    try {
      final appVersion = await ref
          .read(appVersionProvider.future)
          .catchError((Object _) => 'unknown');
      final outcome = await ref
          .read(heartbeatRepositoryProvider)
          .send(
            deviceId: deviceState.device.deviceId,
            appVersion: appVersion,
            deviceTime: DateTime.now(),
          );
      if (!ref.mounted) return;
      switch (outcome) {
        case HeartbeatAccepted(:final status, :final clockOffset):
          if (clockOffset != null) {
            ref.read(serverClockProvider.notifier).setOffset(clockOffset);
          }
          ref
              .read(deviceValidationControllerProvider.notifier)
              .reportStatus(status);
          state = DateTime.now();
        case HeartbeatFailed(:final error):
          // DEVICE_INACTIVE / DEVICE_NOT_FOUND are handled by the monitor;
          // a missed heartbeat while offline is simply skipped.
          AppLogger.warning('device', 'heartbeat failed: ${error.code}');
      }
    } finally {
      _inFlight = false;
    }
  }
}

final heartbeatControllerProvider =
    NotifierProvider<HeartbeatController, DateTime?>(HeartbeatController.new);
