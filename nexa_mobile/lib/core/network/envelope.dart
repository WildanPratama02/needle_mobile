/// Parser for the Docs/12 §7 response envelope:
/// `{ success: true, data, meta }` or
/// `{ success: false, error: { code, message, details, context? }, meta }`.
library;

/// `meta` of any envelope. Pagination fields are present only on list routes.
final class ApiMeta {
  const ApiMeta({
    this.requestId,
    this.page,
    this.pageSize,
    this.total,
    this.totalPages,
  });

  factory ApiMeta.fromJson(Object? json) {
    if (json is! Map<String, Object?>) return const ApiMeta();
    return ApiMeta(
      requestId: json['requestId'] as String?,
      page: (json['page'] as num?)?.toInt(),
      pageSize: (json['pageSize'] as num?)?.toInt(),
      total: (json['total'] as num?)?.toInt(),
      totalPages: (json['totalPages'] as num?)?.toInt(),
    );
  }

  final String? requestId;
  final int? page;
  final int? pageSize;
  final int? total;
  final int? totalPages;
}

/// `error` of a failure envelope.
final class ApiErrorBody {
  const ApiErrorBody({
    required this.code,
    required this.message,
    this.details = const [],
    this.context = const {},
  });

  final String code;
  final String message;
  final List<String> details;
  final Map<String, Object?> context;
}

sealed class Envelope {
  const Envelope(this.meta);

  final ApiMeta meta;

  /// Parses a decoded JSON body. Returns `null` when [body] is not an envelope
  /// at all (a proxy's HTML error page, an empty body, …).
  static Envelope? tryParse(Object? body) {
    if (body is! Map<String, Object?>) return null;
    final success = body['success'];
    final meta = ApiMeta.fromJson(body['meta']);
    if (success == true) {
      return SuccessEnvelope(body['data'], meta);
    }
    if (success == false) {
      final error = body['error'];
      if (error is! Map<String, Object?>) return null;
      final code = error['code'];
      if (code is! String || code.isEmpty) return null;
      final details = error['details'];
      final context = error['context'];
      return FailureEnvelope(
        ApiErrorBody(
          code: code,
          message: (error['message'] as String?) ?? '',
          details: details is List
              ? details.map((d) => d.toString()).toList(growable: false)
              : const [],
          context: context is Map<String, Object?> ? context : const {},
        ),
        meta,
      );
    }
    return null;
  }
}

final class SuccessEnvelope extends Envelope {
  const SuccessEnvelope(this.data, super.meta);

  final Object? data;
}

final class FailureEnvelope extends Envelope {
  const FailureEnvelope(this.error, super.meta);

  final ApiErrorBody error;
}
