import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

/// One request as the fake backend saw it.
class RecordedRequest {
  RecordedRequest(this.method, this.path, this.headers, this.body, this.query);

  final String method;
  final String path;
  final Map<String, Object?> headers;
  final Object? body;
  final Map<String, Object?> query;

  String? header(String name) {
    for (final entry in headers.entries) {
      if (entry.key.toLowerCase() == name.toLowerCase()) {
        return entry.value?.toString();
      }
    }
    return null;
  }
}

/// A canned answer. `body == null` with 204 means no content; [networkError]
/// simulates "no response" (timeout, connection refused).
class FakeResponse {
  const FakeResponse(this.status, [this.body]) : networkError = false;

  const FakeResponse.networkError()
    : status = 0,
      body = null,
      networkError = true;

  final int status;
  final Object? body;
  final bool networkError;

  static FakeResponse ok(Object? data, {int status = 200}) =>
      FakeResponse(status, {
        'success': true,
        'data': data,
        'meta': {'requestId': 'req-1'},
      });

  static FakeResponse error(
    int status,
    String code, {
    String message = 'error',
    Map<String, Object?>? context,
  }) => FakeResponse(status, {
    'success': false,
    'error': {
      'code': code,
      'message': message,
      'details': <String>[],
      'context': ?context,
    },
    'meta': {'requestId': 'req-err'},
  });
}

typedef FakeHandler = FutureOr<FakeResponse> Function(RecordedRequest request);

/// A Dio adapter that plays the backend: handlers per `METHOD /path`, every
/// request recorded. Path is relative to `/api/v1`.
class FakeBackend implements HttpClientAdapter {
  final Map<String, FakeHandler> _handlers = {};
  final List<RecordedRequest> requests = [];

  void on(String method, String path, FakeHandler handler) =>
      _handlers['$method $path'] = handler;

  List<RecordedRequest> requestsTo(String method, String path) => requests
      .where((r) => r.method == method && r.path == path)
      .toList(growable: false);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final path = options.uri.path.replaceFirst('/api/v1', '');
    final request = RecordedRequest(
      options.method,
      path,
      Map<String, Object?>.from(options.headers),
      options.data,
      Map<String, Object?>.from(options.uri.queryParameters),
    );
    requests.add(request);
    final handler = _handlers['${options.method} $path'];
    final response = handler == null
        ? FakeResponse.error(404, 'NOT_FOUND', message: 'no fake for $path')
        : await handler(request);
    if (response.networkError) {
      throw DioException.connectionError(
        requestOptions: options,
        reason: 'fake network error',
      );
    }
    if (response.body == null) {
      return ResponseBody.fromString('', response.status);
    }
    return ResponseBody.fromString(
      jsonEncode(response.body),
      response.status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
