import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/config/app_config.dart';

void main() {
  group('AppConfig.parse', () {
    test('dev allows the LAN http backend', () {
      final config = AppConfig.parse(
        env: 'dev',
        apiBaseUrl: 'http://192.168.43.175:3100/api/v1',
        heartbeatIntervalSeconds: '300',
      );
      expect(config.environment, AppEnvironment.dev);
      expect(config.apiBaseUrl.toString(), 'http://192.168.43.175:3100/api/v1');
      expect(config.heartbeatInterval, const Duration(minutes: 5));
    });

    test('staging and prod require https', () {
      for (final env in ['staging', 'prod']) {
        expect(
          () => AppConfig.parse(env: env, apiBaseUrl: 'http://api.x/api/v1'),
          throwsA(isA<AppConfigException>()),
        );
        expect(
          AppConfig.parse(
            env: env,
            apiBaseUrl: 'https://api.x/api/v1/',
          ).apiBaseUrl.toString(),
          'https://api.x/api/v1',
        );
      }
    });

    test('rejects a missing or unknown environment', () {
      expect(
        () => AppConfig.parse(env: '', apiBaseUrl: 'https://a/api/v1'),
        throwsA(isA<AppConfigException>()),
      );
      expect(
        () => AppConfig.parse(env: 'uat', apiBaseUrl: 'https://a/api/v1'),
        throwsA(isA<AppConfigException>()),
      );
    });

    test('rejects a base URL without /api/v1 or not absolute', () {
      expect(
        () => AppConfig.parse(env: 'dev', apiBaseUrl: 'http://a:3100'),
        throwsA(isA<AppConfigException>()),
      );
      expect(
        () => AppConfig.parse(env: 'dev', apiBaseUrl: '/api/v1'),
        throwsA(isA<AppConfigException>()),
      );
    });

    test('rejects a too-short heartbeat interval', () {
      expect(
        () => AppConfig.parse(
          env: 'dev',
          apiBaseUrl: 'http://a/api/v1',
          heartbeatIntervalSeconds: '5',
        ),
        throwsA(isA<AppConfigException>()),
      );
    });

    test(
      'RFID debounce (Doc 13 §7): default 1000 ms, configurable, bounded',
      () {
        expect(
          AppConfig.parse(
            env: 'dev',
            apiBaseUrl: 'http://a/api/v1',
          ).rfidDebounce,
          const Duration(milliseconds: 1000),
        );
        expect(
          AppConfig.parse(
            env: 'dev',
            apiBaseUrl: 'http://a/api/v1',
            rfidDebounceMs: '1500',
          ).rfidDebounce,
          const Duration(milliseconds: 1500),
        );
        for (final bad in ['abc', '50', '9000']) {
          expect(
            () => AppConfig.parse(
              env: 'dev',
              apiBaseUrl: 'http://a/api/v1',
              rfidDebounceMs: bad,
            ),
            throwsA(isA<AppConfigException>()),
            reason: bad,
          );
        }
      },
    );
  });
}
