import 'dart:async';

import 'package:dio/dio.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/error/error_mapper.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/envelope.dart';
import 'package:nexa_mobile/core/network/headers_interceptor.dart';
import 'package:nexa_mobile/core/network/session_events.dart';
import 'package:nexa_mobile/core/storage/session_token_store.dart';

sealed class RefreshOutcome {
  const RefreshOutcome();
}

/// New tokens are stored; resend with [tokens].
final class RefreshSucceeded extends RefreshOutcome {
  const RefreshSucceeded(this.tokens);

  final SessionTokens tokens;
}

/// The backend refused the refresh token: the session is over, tokens are
/// cleared and [SessionEvents] has been told.
final class RefreshRejected extends RefreshOutcome {
  const RefreshRejected();
}

/// The refresh call itself failed (offline, 5xx). Tokens are kept.
final class RefreshFailed extends RefreshOutcome {
  const RefreshFailed(this.error);

  final AppError error;
}

/// Rotates the token pair with `POST /auth/refresh`, one call at a time.
///
/// Refresh tokens are single-use and rotating; replaying one revokes the whole
/// token family (contract matrix, "Auth"). So:
/// - concurrent callers share one in-flight refresh (single-flight);
/// - a caller whose 401 came from an access token that has *already* been
///   replaced gets the current tokens without a second refresh call;
/// - the refresh token sent is always the latest stored one.
///
/// Uses its own [Dio] without the auth interceptor, so a 401 here can never
/// recurse into another refresh.
class TokenRefresher {
  TokenRefresher({
    required this._dio,
    required this._tokenStore,
    required this._sessionEvents,
    required this._deviceId,
    this._errorMapper = const ErrorMapper(),
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final Dio _dio;
  final SessionTokenStore _tokenStore;
  final SessionEvents _sessionEvents;
  final DeviceIdReader _deviceId;
  final ErrorMapper _errorMapper;
  final DateTime Function() _now;

  Future<RefreshOutcome>? _inFlight;

  /// [failedAccessToken] is the token the 401'd request carried.
  Future<RefreshOutcome> refresh({String? failedAccessToken}) {
    final inFlight = _inFlight;
    if (inFlight != null) return inFlight;
    final future = _run(failedAccessToken);
    _inFlight = future;
    return future.whenComplete(() {
      if (identical(_inFlight, future)) _inFlight = null;
    });
  }

  Future<RefreshOutcome> _run(String? failedAccessToken) async {
    final current = await _tokenStore.read();
    if (current == null) return const RefreshRejected();

    // Another refresh already rotated the pair after this request was sent.
    if (failedAccessToken != null && current.accessToken != failedAccessToken) {
      return RefreshSucceeded(current);
    }

    final deviceId = await _deviceId();
    try {
      final response = await _dio.post<Object?>(
        '/auth/refresh',
        data: {'refreshToken': current.refreshToken},
        options: Options(
          headers: {'X-Device-ID': ?deviceId},
          extra: {RequestFlags.authenticated: false},
        ),
      );
      final envelope = Envelope.tryParse(response.data);
      final data = envelope is SuccessEnvelope ? envelope.data : null;
      if (data is! Map<String, Object?>) {
        // The token was probably consumed but we cannot read the new pair; the
        // only safe move is to end the session rather than replay it.
        return await _reject('refresh answered without a token pair');
      }
      final tokens = SessionTokens(
        accessToken: data['accessToken']! as String,
        refreshToken: data['refreshToken']! as String,
        accessTokenExpiresAt: _now().add(
          Duration(seconds: (data['expiresIn']! as num).toInt()),
        ),
      );
      await _tokenStore.save(tokens);
      return RefreshSucceeded(tokens);
    } on DioException catch (e) {
      final error = _errorMapper.fromDioException(e);
      if (error.httpStatus == 401 || error.httpStatus == 400) {
        return await _reject('refresh rejected (${error.code})');
      }
      AppLogger.warning('auth', 'refresh failed: ${error.code}');
      return RefreshFailed(error);
    } on TypeError {
      return await _reject('refresh answered with an unexpected shape');
    }
  }

  Future<RefreshOutcome> _reject(String why) async {
    AppLogger.warning('auth', 'session ended: $why');
    await _tokenStore.clear();
    _sessionEvents.sessionEnded(SessionEndReason.expired);
    return const RefreshRejected();
  }
}
