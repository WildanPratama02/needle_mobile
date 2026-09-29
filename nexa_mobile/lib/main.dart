import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/app/app.dart';
import 'package:nexa_mobile/core/config/app_config.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';

/// Run with an environment file, e.g.
/// `flutter run --dart-define-from-file=config/dev.json`.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final AppConfig config;
  try {
    config = AppConfig.fromEnvironment();
  } on AppConfigException catch (e) {
    runApp(_ConfigErrorApp(e.message));
    return;
  }

  // Landscape-first on the trolley tablet (Doc 07 §42.1, Doc 17 §3).
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  runApp(
    ProviderScope(
      overrides: [appConfigProvider.overrideWithValue(config)],
      // Business outcomes are modelled as values, not provider errors; never
      // auto-retry a failed provider (Doc 07 §41 keeps retry explicit).
      retry: (_, _) => null,
      child: const NexaApp(),
    ),
  );
}

/// Shown when the build was made without a valid `config/<env>.json`.
class _ConfigErrorApp extends StatelessWidget {
  const _ConfigErrorApp(this.message);

  final String message;

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    home: Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            'Konfigurasi aplikasi tidak valid.\n\n$message',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20),
          ),
        ),
      ),
    ),
  );
}
