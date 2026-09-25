import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/config/app_config.dart';
import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/auth_interceptor.dart';
import 'package:nexa_mobile/core/network/device_access_monitor.dart';
import 'package:nexa_mobile/core/network/headers_interceptor.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';
import 'package:nexa_mobile/core/network/session_events.dart';
import 'package:nexa_mobile/core/network/token_refresher.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';

/// Overridden in `main.dart` with the validated [AppConfig].
final appConfigProvider = Provider<AppConfig>(
  (ref) => throw UnimplementedError('appConfigProvider must be overridden'),
);

final sessionEventsProvider = Provider<SessionEvents>((ref) {
  final events = SessionEvents();
  ref.onDispose(events.dispose);
  return events;
});

final deviceAccessMonitorProvider = Provider<DeviceAccessMonitor>((ref) {
  final monitor = DeviceAccessMonitor();
  ref.onDispose(monitor.dispose);
  return monitor;
});

/// Replaced in tests to route requests to a fake adapter.
final httpClientAdapterProvider = Provider<HttpClientAdapter?>((ref) => null);

BaseOptions _baseOptions(AppConfig config) => BaseOptions(
  baseUrl: config.apiBaseUrl.toString(),
  connectTimeout: config.connectTimeout,
  receiveTimeout: config.receiveTimeout,
  sendTimeout: config.receiveTimeout,
  contentType: Headers.jsonContentType,
  responseType: ResponseType.json,
);

final tokenRefresherProvider = Provider<TokenRefresher>((ref) {
  final config = ref.watch(appConfigProvider);
  final deviceStore = ref.watch(provisionedDeviceStoreProvider);
  final dio = Dio(_baseOptions(config));
  final adapter = ref.watch(httpClientAdapterProvider);
  if (adapter != null) dio.httpClientAdapter = adapter;
  dio.interceptors.add(HeadersInterceptor(deviceId: deviceStore.readDeviceId));
  return TokenRefresher(
    dio: dio,
    tokenStore: ref.watch(sessionTokenStoreProvider),
    sessionEvents: ref.watch(sessionEventsProvider),
    deviceId: deviceStore.readDeviceId,
  );
});

final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final dio = Dio(_baseOptions(config));
  final adapter = ref.watch(httpClientAdapterProvider);
  if (adapter != null) dio.httpClientAdapter = adapter;
  dio.interceptors.addAll([
    HeadersInterceptor(
      deviceId: ref.watch(provisionedDeviceStoreProvider).readDeviceId,
    ),
    AuthInterceptor(
      dio: dio,
      tokenStore: ref.watch(sessionTokenStoreProvider),
      refresher: ref.watch(tokenRefresherProvider),
    ),
  ]);
  ref.onDispose(dio.close);
  return dio;
});

/// The single shared HTTP client (see `nexa_mobile/CLAUDE.md` reuse rule).
final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(
    dio: ref.watch(dioProvider),
    deviceAccessMonitor: ref.watch(deviceAccessMonitorProvider),
  ),
);

/// Doc 07 §41 automatic retry. Tests override it with
/// `RetryPolicy.immediate()` so no real time passes.
final retryPolicyProvider = Provider<RetryPolicy>((ref) => const RetryPolicy());
