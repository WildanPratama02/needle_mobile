import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/app/router.dart';
import 'package:nexa_mobile/app/theme/app_theme.dart';
import 'package:nexa_mobile/features/device_context/presentation/heartbeat_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

class NexaApp extends ConsumerWidget {
  const NexaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Keeps the heartbeat alive for the app's lifetime; it idles itself
    // until the device is validated and online.
    ref.listen(heartbeatControllerProvider, (_, _) {});
    return MaterialApp.router(
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: ref.watch(routerProvider),
    );
  }
}
