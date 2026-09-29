import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

/// Reads the provisioned device id (`null` before provisioning).
typedef DeviceIdReader = Future<String?> Function();

/// `RequestOptions.extra` flags understood by the interceptors.
abstract final class RequestFlags {
  /// `false` for public routes (`/auth/login`, `/auth/refresh`,
  /// `/auth/logout`): no bearer token, no refresh-on-401.
  static const authenticated = 'nexa.authenticated';

  /// Set on the one resend after a token refresh, so a second 401 is final.
  static const retriedAfterRefresh = 'nexa.retriedAfterRefresh';
}

/// Adds the Docs/12 §5 common headers.
///
/// `X-Device-ID` goes on every request once the tablet is provisioned — the
/// contract matrix asks for it on every tablet route and on login/refresh, and
/// the backend ignores it elsewhere.
class HeadersInterceptor extends Interceptor {
  HeadersInterceptor({required this._deviceId, Uuid? uuid})
    : _uuid = uuid ?? const Uuid();

  final DeviceIdReader _deviceId;
  final Uuid _uuid;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    options.headers['Accept'] = 'application/json';
    options.headers['X-Request-ID'] = _uuid.v4();
    final deviceId = await _deviceId();
    if (deviceId != null) {
      options.headers['X-Device-ID'] = deviceId;
    } else {
      options.headers.remove('X-Device-ID');
    }
    handler.next(options);
  }
}
