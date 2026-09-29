import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

/// The exchange commands, for error routing.
enum ExchangeCommand {
  create,
  lookupOperator,
  identifyOperator,
  selectType,
  recordFragment,
  uploadEvidence,
  selectNewNeedle,
  issue,
  storeUsedNeedle,
  complete,
  cancel,
  refresh,
}

/// What the wizard does with a failed command. Uses the backend codes, per the
/// contract matrix "Doc 07 error names → backend codes" table (MG-8).
sealed class ExchangeErrorRoute {
  const ExchangeErrorRoute();
}

/// `EXCHANGE_INVALID_STATE` (Doc 07 `INVALID_STATE`) or a state conflict: the
/// tablet is out of step. Re-read `GET /exchanges/{id}` and show the step of
/// the authoritative state. Never retried automatically.
final class ResyncWithServer extends ExchangeErrorRoute {
  const ResyncWithServer();
}

/// `EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED` (Doc 07 `CONFIRMATION_REJECTED`):
/// the exchange is held at `CONFIRMATION_PENDING`.
final class AwaitConfirmation extends ExchangeErrorRoute {
  const AwaitConfirmation(this.status);

  /// `context.confirmationStatus` — `PENDING` / `REJECTED` / `EXPIRED`.
  final ConfirmationStatus? status;
}

/// `INVENTORY_INSUFFICIENT_STOCK` (Doc 07 `STOCK_NOT_AVAILABLE`, §24).
final class StockUnavailable extends ExchangeErrorRoute {
  const StockUnavailable({this.availableQuantity, this.requestedQuantity});

  final int? availableQuantity;
  final int? requestedQuantity;
}

/// The RFID card or its employee cannot be used (Doc 13 §9).
final class OperatorRejected extends ExchangeErrorRoute {
  const OperatorRejected();
}

/// `EXCHANGE_NOT_FOUND`: the server no longer knows this exchange.
final class ExchangeGone extends ExchangeErrorRoute {
  const ExchangeGone();
}

/// `/type` or `/new-needle` answered "needle/exchange type not found or
/// inactive" (400): the cached master data is stale (Doc 17 §13).
final class MasterDataStale extends ExchangeErrorRoute {
  const MasterDataStale();
}

/// `/fragment NOT_FOUND` with no APPROVER scoped to the factory (409): no
/// confirmation can be raised. An admin must fix the setup.
final class NoApproverAvailable extends ExchangeErrorRoute {
  const NoApproverAvailable();
}

/// `/store-used-needle` with no active storage mapping (409).
final class NoStorageMapping extends ExchangeErrorRoute {
  const NoStorageMapping();
}

/// `NETWORK_TIMEOUT` / `TEMPORARY_SERVER_ERROR` still failing after the
/// automatic retries: offer "COBA LAGI" — the same attempt, same key.
final class TransientFailure extends ExchangeErrorRoute {
  const TransientFailure();
}

/// `DEVICE_INACTIVE` / `DEVICE_NOT_FOUND` / session expired: the app-wide
/// handlers (device monitor, session events) take over; the wizard only
/// stops.
final class HandledGlobally extends ExchangeErrorRoute {
  const HandledGlobally();
}

/// Anything else: show the mapped message, no automatic action.
final class ShowError extends ExchangeErrorRoute {
  const ShowError();
}

/// Pure routing rule, unit-tested on its own.
ExchangeErrorRoute routeExchangeError(ExchangeCommand command, AppError error) {
  if (error.isRetryable) return const TransientFailure();
  switch (error.code) {
    case BackendErrorCodes.exchangeInvalidState:
      return const ResyncWithServer();
    case BackendErrorCodes.exchangeFragmentConfirmationRequired:
      final raw = error.context['confirmationStatus'];
      return AwaitConfirmation(
        ConfirmationStatus.fromWire(raw is String ? raw : null),
      );
    case BackendErrorCodes.inventoryInsufficientStock:
      return StockUnavailable(
        availableQuantity: _int(error.context['availableQuantity']),
        requestedQuantity: _int(error.context['requestedQuantity']),
      );
    case BackendErrorCodes.rfidNotFound:
    case BackendErrorCodes.rfidInactive:
    case BackendErrorCodes.employeeNotFound:
    case BackendErrorCodes.employeeInactive:
      return const OperatorRejected();
    case BackendErrorCodes.factoryScopeDenied:
      return command == ExchangeCommand.lookupOperator
          ? const OperatorRejected()
          : const ShowError();
    case BackendErrorCodes.exchangeNotFound:
      return const ExchangeGone();
    case BackendErrorCodes.deviceInactive:
    case BackendErrorCodes.deviceNotFound:
    case BackendErrorCodes.unauthorized:
    case BackendErrorCodes.authInvalidToken:
      return const HandledGlobally();
    case BackendErrorCodes.validationError:
      return switch (command) {
        ExchangeCommand.selectType ||
        ExchangeCommand.selectNewNeedle => const MasterDataStale(),
        // `/operator` answers 400 for an unknown/inactive card too.
        ExchangeCommand.identifyOperator => const OperatorRejected(),
        _ => const ShowError(),
      };
    case BackendErrorCodes.conflict:
      return switch (command) {
        ExchangeCommand.recordFragment => const NoApproverAvailable(),
        ExchangeCommand.storeUsedNeedle => const NoStorageMapping(),
        // Evidence refused for the state, already completed/cancelled, "no
        // new needle selected", "missing …" on complete: all out of step.
        _ => const ResyncWithServer(),
      };
  }
  return const ShowError();
}

int? _int(Object? value) => value is num ? value.toInt() : null;
