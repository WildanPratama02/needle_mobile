import 'package:dio/dio.dart';
import 'package:nexa_mobile/core/error/error_mapper.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/device_access_monitor.dart';
import 'package:nexa_mobile/core/network/envelope.dart';
import 'package:nexa_mobile/core/network/headers_interceptor.dart';

/// Decodes the envelope's `data` into a typed value. Throwing a [TypeError] or
/// [FormatException] here is reported as a malformed response.
typedef Decoder<T> = T Function(Object? data);

/// The one HTTP entry point of the app. Remote data sources in `features/*/data`
/// call this; widgets and Notifiers never do (Doc 07 §39).
///
/// Every call returns an [ApiResult] — parsed envelope or mapped [AppError] —
/// and never throws for HTTP or decoding failures.
class ApiClient {
  ApiClient({
    required this._dio,
    required this._deviceAccessMonitor,
    this._errorMapper = const ErrorMapper(),
  });

  final Dio _dio;
  final DeviceAccessMonitor _deviceAccessMonitor;
  final ErrorMapper _errorMapper;

  Future<ApiResult<T>> get<T>(
    String path, {
    required Decoder<T> decode,
    Map<String, Object?>? query,
    bool authenticated = true,
  }) => _send(
    path,
    method: 'GET',
    decode: decode,
    query: query,
    authenticated: authenticated,
  );

  /// [idempotencyKey] is required by Docs/12 §25 for every business command
  /// (`nexa_mobile/CLAUDE.md` §4). Auth routes and the heartbeat take none.
  Future<ApiResult<T>> post<T>(
    String path, {
    required Decoder<T> decode,
    Object? body,
    String? idempotencyKey,
    bool authenticated = true,
  }) => _send(
    path,
    method: 'POST',
    decode: decode,
    body: body,
    idempotencyKey: idempotencyKey,
    authenticated: authenticated,
  );

  Future<ApiResult<T>> _send<T>(
    String path, {
    required String method,
    required Decoder<T> decode,
    Object? body,
    Map<String, Object?>? query,
    String? idempotencyKey,
    required bool authenticated,
  }) async {
    final Response<Object?> response;
    try {
      response = await _dio.request<Object?>(
        path,
        data: body,
        queryParameters: query == null
            ? null
            : {
                for (final e in query.entries)
                  if (e.value != null) e.key: e.value,
              },
        options: Options(
          method: method,
          headers: {'Idempotency-Key': ?idempotencyKey},
          extra: {RequestFlags.authenticated: authenticated},
        ),
      );
    } on DioException catch (e) {
      final error = _errorMapper.fromDioException(e);
      AppLogger.warning(
        'api',
        '$method $path → ${error.code} (${error.httpStatus}) '
            'requestId=${error.requestId}',
      );
      _deviceAccessMonitor.report(error);
      return ApiFailure(error);
    }

    final status = response.statusCode ?? 0;
    // 204 carries no envelope (Docs/12 §8).
    if (status == 204) {
      return _decode(decode, null, const ApiMeta(), status);
    }
    final envelope = Envelope.tryParse(response.data);
    return switch (envelope) {
      SuccessEnvelope(:final data, :final meta) => _decode(
        decode,
        data,
        meta,
        status,
      ),
      _ => ApiFailure(_errorMapper.malformedResponse(status)),
    };
  }

  ApiResult<T> _decode<T>(
    Decoder<T> decode,
    Object? data,
    ApiMeta meta,
    int status,
  ) {
    try {
      return ApiSuccess(decode(data), meta);
    } on TypeError catch (e, s) {
      AppLogger.error('api', 'decode failed', error: e, stackTrace: s);
      return ApiFailure(_errorMapper.malformedResponse(status));
    } on FormatException catch (e, s) {
      AppLogger.error('api', 'decode failed', error: e, stackTrace: s);
      return ApiFailure(_errorMapper.malformedResponse(status));
    }
  }
}
