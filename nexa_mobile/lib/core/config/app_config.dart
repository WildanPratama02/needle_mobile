/// Environment configuration, read from dart-defines at build time.
///
/// Run/build with `--dart-define-from-file=config/<env>.json`
/// (`nexa_mobile/CLAUDE.md` §2, build flavor row). The values are validated at
/// start-up so a misconfigured build fails loudly instead of talking to the
/// wrong backend.
library;

enum AppEnvironment {
  dev,
  staging,
  prod;

  static AppEnvironment? tryParse(String value) {
    for (final env in values) {
      if (env.name == value) return env;
    }
    return null;
  }
}

/// Thrown when the dart-defines are missing or invalid.
class AppConfigException implements Exception {
  const AppConfigException(this.message);

  final String message;

  @override
  String toString() => 'AppConfigException: $message';
}

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    this.heartbeatInterval = const Duration(minutes: 5),
    this.connectTimeout = const Duration(seconds: 10),
    this.receiveTimeout = const Duration(seconds: 20),
  });

  /// Reads the compile-time dart-defines. `const String.fromEnvironment` only
  /// works in a const context, so the raw values are captured here and handed
  /// to [parse], which holds the rules and is unit-tested.
  factory AppConfig.fromEnvironment() {
    return parse(
      env: const String.fromEnvironment('APP_ENV'),
      apiBaseUrl: const String.fromEnvironment('API_BASE_URL'),
      heartbeatIntervalSeconds: const String.fromEnvironment(
        'HEARTBEAT_INTERVAL_SECONDS',
      ),
    );
  }

  /// Validates raw configuration values.
  ///
  /// Rules: the environment must be one of dev/staging/prod; the base URL must
  /// be absolute and end with the `/api/v1` version prefix (Docs/12 §3–4); only
  /// `dev` may use plain `http` (Doc 07 §45 "menggunakan HTTPS").
  static AppConfig parse({
    required String env,
    required String apiBaseUrl,
    String heartbeatIntervalSeconds = '',
  }) {
    final environment = AppEnvironment.tryParse(env.trim());
    if (environment == null) {
      throw AppConfigException(
        'APP_ENV must be dev, staging or prod (got "$env"). '
        'Run with --dart-define-from-file=config/<env>.json.',
      );
    }

    final uri = Uri.tryParse(apiBaseUrl.trim());
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw const AppConfigException('API_BASE_URL must be an absolute URL.');
    }
    if (uri.scheme != 'https' && uri.scheme != 'http') {
      throw const AppConfigException('API_BASE_URL must use http or https.');
    }
    if (uri.scheme == 'http' && environment != AppEnvironment.dev) {
      throw AppConfigException(
        'API_BASE_URL must use https in ${environment.name}.',
      );
    }
    final normalized = uri.path.endsWith('/')
        ? uri.path.substring(0, uri.path.length - 1)
        : uri.path;
    if (!normalized.endsWith('/api/v1')) {
      throw const AppConfigException('API_BASE_URL must end with /api/v1.');
    }

    var heartbeat = const Duration(minutes: 5);
    if (heartbeatIntervalSeconds.trim().isNotEmpty) {
      final seconds = int.tryParse(heartbeatIntervalSeconds.trim());
      if (seconds == null || seconds < 30) {
        throw const AppConfigException(
          'HEARTBEAT_INTERVAL_SECONDS must be an integer >= 30.',
        );
      }
      heartbeat = Duration(seconds: seconds);
    }

    return AppConfig(
      environment: environment,
      apiBaseUrl: uri.replace(path: normalized),
      heartbeatInterval: heartbeat,
    );
  }

  final AppEnvironment environment;
  final Uri apiBaseUrl;
  final Duration heartbeatInterval;
  final Duration connectTimeout;
  final Duration receiveTimeout;
}
