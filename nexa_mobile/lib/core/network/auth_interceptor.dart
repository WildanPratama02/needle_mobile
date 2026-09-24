import 'package:dio/dio.dart';
import 'package:nexa_mobile/core/network/headers_interceptor.dart';
import 'package:nexa_mobile/core/network/token_refresher.dart';
import 'package:nexa_mobile/core/storage/session_token_store.dart';

/// Adds `Authorization: Bearer <access>` and, on a 401, refreshes once and
/// resends once (contract matrix: "HTTP 401 → refresh the token, then resend —
/// once").
///
/// Public routes opt out with `extra[RequestFlags.authenticated] = false`.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this._dio,
    required this._tokenStore,
    required this._refresher,
  });

  final Dio _dio;
  final SessionTokenStore _tokenStore;
  final TokenRefresher _refresher;

  static bool _isAuthenticated(RequestOptions options) =>
      options.extra[RequestFlags.authenticated] != false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (_isAuthenticated(options)) {
      final tokens = await _tokenStore.read();
      if (tokens != null) {
        options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
      }
    } else {
      options.headers.remove('Authorization');
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final options = err.requestOptions;
    final unauthorized = err.response?.statusCode == 401;
    if (!unauthorized ||
        !_isAuthenticated(options) ||
        options.extra[RequestFlags.retriedAfterRefresh] == true) {
      handler.next(err);
      return;
    }

    final sentHeader = options.headers['Authorization'];
    final sentToken = sentHeader is String && sentHeader.startsWith('Bearer ')
        ? sentHeader.substring('Bearer '.length)
        : null;

    final outcome = await _refresher.refresh(failedAccessToken: sentToken);
    if (outcome is! RefreshSucceeded) {
      handler.next(err);
      return;
    }

    options.extra[RequestFlags.retriedAfterRefresh] = true;
    try {
      final response = await _dio.fetch<Object?>(options);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }
}
