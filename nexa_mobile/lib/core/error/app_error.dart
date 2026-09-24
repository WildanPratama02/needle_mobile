/// Error categories from Doc 07 §40.
enum ErrorCategory {
  technical,
  business,
  network,
  authentication,
  authorization,
  conflict,
}

/// Codes the client produces itself, when there is no backend `error.code`.
///
/// `NETWORK_TIMEOUT` and `TEMPORARY_SERVER_ERROR` are the only codes on the
/// automatic-retry whitelist (Doc 07 §41, `nexa_mobile/CLAUDE.md` §4).
abstract final class ClientErrorCodes {
  /// No response at all: timeout, connection refused, no route.
  static const networkTimeout = 'NETWORK_TIMEOUT';

  /// A 5xx answer.
  static const temporaryServerError = 'TEMPORARY_SERVER_ERROR';

  /// The server answered, but not with the Docs/12 §7 envelope.
  static const malformedResponse = 'MALFORMED_RESPONSE';

  /// Anything thrown on the client that is not an HTTP failure.
  static const unexpected = 'UNEXPECTED_ERROR';
}

/// Backend `error.code` values the tablet branches on (Docs/12 §23, as built in
/// `Backend/src/common/errors/domain.exception.ts` plus the status-derived codes
/// of `http-exception.filter.ts`).
abstract final class BackendErrorCodes {
  static const unauthorized = 'UNAUTHORIZED';
  static const authInvalidToken = 'AUTH_INVALID_TOKEN';
  static const forbidden = 'FORBIDDEN';
  static const authForbidden = 'AUTH_FORBIDDEN';
  static const validationError = 'VALIDATION_ERROR';
  static const notFound = 'NOT_FOUND';
  static const conflict = 'CONFLICT';
  static const unprocessableEntity = 'UNPROCESSABLE_ENTITY';
  static const rateLimited = 'RATE_LIMITED';
  static const serviceUnavailable = 'SERVICE_UNAVAILABLE';
  static const internalError = 'INTERNAL_ERROR';

  static const exchangeNotFound = 'EXCHANGE_NOT_FOUND';
  static const exchangeInvalidState = 'EXCHANGE_INVALID_STATE';
  static const exchangeFragmentConfirmationRequired =
      'EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED';
  static const inventoryInsufficientStock = 'INVENTORY_INSUFFICIENT_STOCK';
  static const idempotencyKeyReused = 'IDEMPOTENCY_KEY_REUSED';

  static const deviceContextRequired = 'DEVICE_CONTEXT_REQUIRED';
  static const deviceNotFound = 'DEVICE_NOT_FOUND';
  static const deviceInactive = 'DEVICE_INACTIVE';
  static const deviceMismatch = 'DEVICE_MISMATCH';
  static const rfidNotFound = 'RFID_NOT_FOUND';
  static const rfidInactive = 'RFID_INACTIVE';
  static const employeeNotFound = 'EMPLOYEE_NOT_FOUND';
  static const employeeInactive = 'EMPLOYEE_INACTIVE';
  static const factoryScopeDenied = 'FACTORY_SCOPE_DENIED';
}

/// The Doc 07 §40–41 error names, mapped to backend codes by the contract
/// matrix table "Doc 07 error names → backend codes" (MG-8: backend codes win,
/// Doc 07 names are narrative).
enum SpecErrorName {
  stockNotAvailable('STOCK_NOT_AVAILABLE'),
  invalidState('INVALID_STATE'),
  confirmationRejected('CONFIRMATION_REJECTED'),
  deviceRevoked('DEVICE_REVOKED'),
  accessDenied('ACCESS_DENIED'),
  networkTimeout('NETWORK_TIMEOUT'),
  temporaryServerError('TEMPORARY_SERVER_ERROR');

  const SpecErrorName(this.value);

  final String value;
}

/// A failure, safe to show: [userMessage] never contains a stack trace, SQL,
/// a token or an internal URL (Doc 07 §40, Doc 17 §32).
final class AppError {
  const AppError({
    required this.category,
    required this.code,
    required this.userMessage,
    this.httpStatus,
    this.serverMessage,
    this.details = const [],
    this.context = const {},
    this.requestId,
  });

  final ErrorCategory category;

  /// Backend `error.code`, or one of [ClientErrorCodes].
  final String code;

  /// Indonesian text for the PIC (Doc 17 §32).
  final String userMessage;

  final int? httpStatus;

  /// The backend's own `error.message` — for logs, not for the screen.
  final String? serverMessage;

  /// `error.details` — field validation messages.
  final List<String> details;

  /// `error.context` — structured facts (e.g. `status`, `availableQuantity`).
  final Map<String, Object?> context;

  final String? requestId;

  /// Doc 07 §41: only these two retry automatically. A business rejection never
  /// does.
  bool get isRetryable =>
      code == ClientErrorCodes.networkTimeout ||
      code == ClientErrorCodes.temporaryServerError;

  /// The Doc 07 name for this error, when the matrix defines one.
  SpecErrorName? get specName => switch (code) {
    BackendErrorCodes.inventoryInsufficientStock =>
      SpecErrorName.stockNotAvailable,
    BackendErrorCodes.exchangeInvalidState => SpecErrorName.invalidState,
    BackendErrorCodes.exchangeFragmentConfirmationRequired =>
      SpecErrorName.confirmationRejected,
    BackendErrorCodes.deviceInactive => SpecErrorName.deviceRevoked,
    BackendErrorCodes.forbidden ||
    BackendErrorCodes.factoryScopeDenied => SpecErrorName.accessDenied,
    ClientErrorCodes.networkTimeout => SpecErrorName.networkTimeout,
    ClientErrorCodes.temporaryServerError => SpecErrorName.temporaryServerError,
    _ => null,
  };

  AppError copyWith({String? userMessage}) => AppError(
    category: category,
    code: code,
    userMessage: userMessage ?? this.userMessage,
    httpStatus: httpStatus,
    serverMessage: serverMessage,
    details: details,
    context: context,
    requestId: requestId,
  );

  @override
  String toString() =>
      'AppError($code, ${category.name}, status: $httpStatus, requestId: $requestId)';
}
