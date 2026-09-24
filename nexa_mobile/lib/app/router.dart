import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/app_gate.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/features/auth/presentation/login_screen.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_blocked_screen.dart';
import 'package:nexa_mobile/features/device_context/presentation/home_screen.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_screen.dart';
import 'package:nexa_mobile/features/device_context/presentation/startup_screen.dart';
import 'package:nexa_mobile/features/settings/presentation/settings_screen.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/widgets/feature_pending_screen.dart';

/// Where each gate may be, and where it lands by default. No screen that
/// needs a validated device is reachable before validation (Doc 17 §53).
@visibleForTesting
String? redirectFor(AppGate gate, String location) {
  bool under(String root) => location == root || location.startsWith('$root/');
  final (allowed, fallback) = switch (gate) {
    AppGate.starting ||
    AppGate.validating => (under(Routes.startup), Routes.startup),
    AppGate.provisioning => (under(Routes.provision), Routes.provision),
    AppGate.login => (under(Routes.login), Routes.login),
    AppGate.blocked => (
      under(Routes.blocked) || under(Routes.settings),
      Routes.blocked,
    ),
    AppGate.ready => (
      under(Routes.home) || under(Routes.settings),
      Routes.home,
    ),
  };
  return allowed ? null : fallback;
}

final routerProvider = Provider<GoRouter>((ref) {
  final gate = ValueNotifier<AppGate>(ref.read(appGateProvider));
  ref.listen(appGateProvider, (_, next) => gate.value = next);

  final router = GoRouter(
    initialLocation: Routes.startup,
    refreshListenable: gate,
    redirect: (context, state) =>
        redirectFor(gate.value, state.matchedLocation),
    routes: [
      GoRoute(
        path: Routes.startup,
        builder: (context, state) => const StartupScreen(),
      ),
      GoRoute(
        path: Routes.provision,
        builder: (context, state) => const ProvisioningScreen(),
      ),
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: Routes.blocked,
        builder: (context, state) => const DeviceBlockedScreen(),
      ),
      GoRoute(
        path: Routes.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: Routes.home,
        builder: (context, state) => const HomeScreen(),
        routes: [
          GoRoute(
            path: 'exchange/new',
            builder: (context, state) =>
                const FeaturePendingScreen(title: AppStrings.newExchange),
          ),
          GoRoute(
            path: 'stock',
            builder: (context, state) =>
                const FeaturePendingScreen(title: AppStrings.trolleyStock),
          ),
          GoRoute(
            path: 'history',
            builder: (context, state) =>
                const FeaturePendingScreen(title: AppStrings.history),
          ),
        ],
      ),
    ],
  );
  ref.onDispose(() {
    router.dispose();
    gate.dispose();
  });
  return router;
});
