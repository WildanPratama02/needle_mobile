import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_qr_payload.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

sealed class ProvisioningState {
  const ProvisioningState();
}

final class ProvisioningLoading extends ProvisioningState {
  const ProvisioningLoading();
}

final class Unprovisioned extends ProvisioningState {
  const Unprovisioned({this.notice});

  /// Why the tablet is back here (e.g. the backend no longer knows the id).
  final String? notice;
}

final class Provisioned extends ProvisioningState {
  const Provisioned(this.device);

  final ProvisionedDevice device;
}

/// First-launch provisioning (contract matrix MG-1) and re-provisioning.
class ProvisioningController extends Notifier<ProvisioningState> {
  @override
  ProvisioningState build() {
    unawaited(_load());
    return const ProvisioningLoading();
  }

  Future<void> _load() async {
    final device = await ref.read(provisioningRepositoryProvider).current();
    if (!ref.mounted) return;
    state = device == null ? const Unprovisioned() : Provisioned(device);
  }

  /// Checks a scanned QR value. Nothing is stored until [confirm] — the
  /// operator first sees which device code was learned.
  DeviceQrParseResult review(String rawValue) =>
      DeviceQrPayloadParser.parse(rawValue);

  Future<void> confirm(DeviceQrPayload payload) => _save(
    ProvisionedDevice(
      deviceId: payload.deviceId,
      deviceCode: payload.deviceCode,
    ),
  );

  /// Manual-entry fallback. Returns an error message, or `null` when stored.
  Future<String?> submitManual(String input) async {
    final deviceId = DeviceQrPayloadParser.parseManualDeviceId(input);
    if (deviceId == null) return AppStrings.manualInvalidDeviceId;
    await _save(ProvisionedDevice(deviceId: deviceId));
    return null;
  }

  Future<void> _save(ProvisionedDevice device) async {
    await ref.read(provisioningRepositoryProvider).save(device);
    if (!ref.mounted) return;
    state = Provisioned(device);
  }

  /// Forget the device: sign out first (the session is tied to the old
  /// `X-Device-ID`), then clear the id and every device-bound cache.
  Future<void> reset({String? notice}) async {
    final session = ref.read(sessionControllerProvider);
    if (session is SignedIn) {
      await ref
          .read(sessionControllerProvider.notifier)
          .logout(reason: SignOutReason.deviceReset);
    }
    await ref.read(provisioningRepositoryProvider).clear();
    if (!ref.mounted) return;
    state = Unprovisioned(notice: notice);
  }

  /// Bootstrap learned the code of a manually entered id.
  void updateCode(String deviceCode) {
    final current = state;
    if (current is Provisioned && current.device.deviceCode != deviceCode) {
      state = Provisioned(
        ProvisionedDevice(
          deviceId: current.device.deviceId,
          deviceCode: deviceCode,
        ),
      );
    }
  }
}

final provisioningControllerProvider =
    NotifierProvider<ProvisioningController, ProvisioningState>(
      ProvisioningController.new,
    );
