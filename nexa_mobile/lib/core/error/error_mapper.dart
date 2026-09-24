import 'package:dio/dio.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/error/error_messages.dart';
import 'package:nexa_mobile/core/network/envelope.dart';

/// Turns transport failures and failure envelopes into [AppError].
///
/// Category rules (Doc 07 §40), by backend code first, then by HTTP status:
/// - no response → network, `NETWORK_TIMEOUT` (retryable)
/// - 5xx → technical, `TEMPORARY_SERVER_ERROR` (retryable)
/// - 401 → authentication
/// - 403 → authorization (includes `DEVICE_INACTIVE`, `DEVICE_MISMATCH`)
/// - 409 → conflict, except `INVENTORY_INSUFFICIENT_STOCK` (business —
///   Doc 07 treats "stock not available" as a business error) and
///   `IDEMPOTENCY_KEY_REUSED` (technical — a client bug, matrix note)
/// - 400/404/422 → business, except `DEVICE_CONTEXT_REQUIRED` (technical —
///   the client failed to send its device id)
/// - 429 → technical `RATE_LIMITED` (not on the retry whitelist)
class ErrorMapper {
  const ErrorMapper();

  AppError fromDioException(DioException exception) {
    final response = exception.response;
    if (response == null) {
      return _networkTimeout();
    }
    return fromResponse(response.statusCode ?? 0, response.data);
  }

  /// Maps a non-2xx answer (or a 2xx answer with a broken body).
  AppError fromResponse(int status, Object? body) {
    final envelope = Envelope.tryParse(body);
    if (envelope is FailureEnvelope) {
      return fromErrorBody(status, envelope.error, envelope.meta.requestId);
    }
    if (status >= 500) return _temporaryServerError(status, null);
    if (status >= 400) {
      // A 4xx without our envelope (e.g. a proxy): categorise by status only.
      final category = _categoryForStatus(status);
      return AppError(
        category: category,
        code: _statusCode(status),
        userMessage: ErrorMessages.forCategory(category),
        httpStatus: status,
      );
    }
    return malformedResponse(status);
  }

  AppError fromErrorBody(int status, ApiErrorBody error, String? requestId) {
    if (status >= 500) {
      return _temporaryServerError(status, requestId, error);
    }
    final category = _categoryFor(status, error.code);
    return AppError(
      category: category,
      code: error.code,
      userMessage: ErrorMessages.forCode(error.code, category),
      httpStatus: status,
      serverMessage: error.message,
      details: error.details,
      context: error.context,
      requestId: requestId,
    );
  }

  AppError malformedResponse(int? status) => AppError(
    category: ErrorCategory.technical,
    code: ClientErrorCodes.malformedResponse,
    userMessage: ErrorMessages.forCode(
      ClientErrorCodes.malformedResponse,
      ErrorCategory.technical,
    ),
    httpStatus: status,
  );

  AppError unexpected() => AppError(
    category: ErrorCategory.technical,
    code: ClientErrorCodes.unexpected,
    userMessage: ErrorMessages.forCategory(ErrorCategory.technical),
  );

  ErrorCategory _categoryFor(int status, String code) {
    switch (code) {
      case BackendErrorCodes.inventoryInsufficientStock:
        return ErrorCategory.business;
      case BackendErrorCodes.idempotencyKeyReused:
      case BackendErrorCodes.deviceContextRequired:
      case BackendErrorCodes.rateLimited:
        return ErrorCategory.technical;
      case BackendErrorCodes.exchangeInvalidState:
        return ErrorCategory.conflict;
    }
    return _categoryForStatus(status);
  }

  ErrorCategory _categoryForStatus(int status) => switch (status) {
    401 => ErrorCategory.authentication,
    403 => ErrorCategory.authorization,
    409 => ErrorCategory.conflict,
    429 => ErrorCategory.technical,
    >= 400 && < 500 => ErrorCategory.business,
    _ => ErrorCategory.technical,
  };

  String _statusCode(int status) => switch (status) {
    400 => BackendErrorCodes.validationError,
    401 => BackendErrorCodes.unauthorized,
    403 => BackendErrorCodes.forbidden,
    404 => BackendErrorCodes.notFound,
    409 => BackendErrorCodes.conflict,
    422 => BackendErrorCodes.unprocessableEntity,
    429 => BackendErrorCodes.rateLimited,
    _ => ClientErrorCodes.unexpected,
  };

  AppError _networkTimeout() => AppError(
    category: ErrorCategory.network,
    code: ClientErrorCodes.networkTimeout,
    userMessage: ErrorMessages.forCode(
      ClientErrorCodes.networkTimeout,
      ErrorCategory.network,
    ),
  );

  AppError _temporaryServerError(
    int status,
    String? requestId, [
    ApiErrorBody? body,
  ]) => AppError(
    category: ErrorCategory.technical,
    code: ClientErrorCodes.temporaryServerError,
    userMessage: ErrorMessages.forCode(
      ClientErrorCodes.temporaryServerError,
      ErrorCategory.technical,
    ),
    httpStatus: status,
    serverMessage: body?.message,
    requestId: requestId,
  );
}
