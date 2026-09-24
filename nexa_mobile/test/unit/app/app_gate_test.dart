import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/app/app_gate.dart';
import 'package:nexa_mobile/app/router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/auth/domain/auth_user.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';

void main() {
  const provisioned = Provisioned(ProvisionedDevice(deviceId: 'd'));
  const signedIn = SignedIn(
    AuthUser(id: 'u', username: 'u', name: 'U', roles: []),
  );
  const error = AppError(
    category: ErrorCategory.network,
    code: 'NETWORK_TIMEOUT',
    userMessage: '-',
  );
  final context = DeviceContextSnapshot(
    device: const DeviceInfo(
      id: 'd',
      code: 'c',
      name: 'n',
      status: DeviceStatus.active,
    ),
    factory: const FactoryInfo(id: 'f', code: 'F', name: 'F', timezone: 'tz'),
    trolley: const TrolleyInfo(id: 't', code: 'T', name: 'T', locationId: 'l'),
    serverTime: DateTime.utc(2026),
    syncCursor: 'c',
    fetchedAt: DateTime.utc(2026),
  );

  AppGate gate(
    ProvisioningState p,
    SessionState s, [
    DeviceValidationState v = const ValidationIdle(),
  ]) => resolveAppGate(provisioning: p, session: s, validation: v);

  group('resolveAppGate (Doc 17 §43 order)', () {
    test('device check comes before authentication', () {
      expect(gate(const ProvisioningLoading(), signedIn), AppGate.starting);
      expect(gate(const Unprovisioned(), signedIn), AppGate.provisioning);
    });

    test('then the session', () {
      expect(gate(provisioned, const SessionRestoring()), AppGate.starting);
      expect(gate(provisioned, const SignedOut()), AppGate.login);
    });

    test('then device validation', () {
      expect(gate(provisioned, signedIn), AppGate.validating);
      expect(
        gate(provisioned, signedIn, const ValidationChecking()),
        AppGate.validating,
      );
      expect(
        gate(provisioned, signedIn, ValidationPassed(context)),
        AppGate.ready,
      );
      expect(
        gate(provisioned, signedIn, ValidationPassed(context, fromCache: true)),
        AppGate.ready,
        reason: 'offline with a cached ACTIVE context stays usable',
      );
      for (final blocked in [
        const ValidationBlocked(DeviceStatus.revoked),
        const ValidationAccessDenied(error),
        const ValidationUnavailable(error),
      ]) {
        expect(gate(provisioned, signedIn, blocked), AppGate.blocked);
      }
    });
  });

  group('redirectFor', () {
    test('keeps an allowed location', () {
      expect(redirectFor(AppGate.ready, Routes.home), isNull);
      expect(redirectFor(AppGate.ready, Routes.history), isNull);
      expect(redirectFor(AppGate.ready, Routes.settings), isNull);
      expect(redirectFor(AppGate.blocked, Routes.settings), isNull);
    });

    test('no transaction screen is reachable before validation', () {
      for (final gate in [
        AppGate.starting,
        AppGate.provisioning,
        AppGate.login,
        AppGate.validating,
        AppGate.blocked,
      ]) {
        expect(redirectFor(gate, Routes.newExchange), isNotNull);
        expect(redirectFor(gate, Routes.home), isNotNull);
      }
    });

    test('sends each gate to its screen', () {
      expect(redirectFor(AppGate.provisioning, Routes.home), Routes.provision);
      expect(redirectFor(AppGate.login, Routes.startup), Routes.login);
      expect(redirectFor(AppGate.blocked, Routes.home), Routes.blocked);
      expect(redirectFor(AppGate.ready, Routes.login), Routes.home);
      expect(redirectFor(AppGate.validating, Routes.login), Routes.startup);
    });
  });
}
