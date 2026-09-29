import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_error_route.dart';

AppError _e(
  String code, {
  ErrorCategory category = ErrorCategory.business,
  Map<String, Object?> context = const {},
}) => AppError(
  category: category,
  code: code,
  userMessage: 'x',
  context: context,
);

void main() {
  group('routeExchangeError (matrix "Doc 07 error names → backend codes")', () {
    test('NETWORK_TIMEOUT / TEMPORARY_SERVER_ERROR → transient (retry)', () {
      for (final code in [
        ClientErrorCodes.networkTimeout,
        ClientErrorCodes.temporaryServerError,
      ]) {
        expect(
          routeExchangeError(ExchangeCommand.issue, _e(code)),
          isA<TransientFailure>(),
        );
      }
    });

    test('EXCHANGE_INVALID_STATE → re-read the server, for every command', () {
      for (final command in ExchangeCommand.values) {
        expect(
          routeExchangeError(
            command,
            _e(BackendErrorCodes.exchangeInvalidState),
          ),
          isA<ResyncWithServer>(),
          reason: command.name,
        );
      }
    });

    test('EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED carries the status', () {
      final route = routeExchangeError(
        ExchangeCommand.uploadEvidence,
        _e(
          BackendErrorCodes.exchangeFragmentConfirmationRequired,
          context: {'confirmationStatus': 'REJECTED'},
        ),
      );
      expect((route as AwaitConfirmation).status, ConfirmationStatus.rejected);
    });

    test('INVENTORY_INSUFFICIENT_STOCK → Doc 07 §24 with the quantities', () {
      final route = routeExchangeError(
        ExchangeCommand.selectNewNeedle,
        _e(
          BackendErrorCodes.inventoryInsufficientStock,
          context: {'availableQuantity': 0, 'requestedQuantity': 1},
        ),
      );
      expect((route as StockUnavailable).availableQuantity, 0);
      expect(route.requestedQuantity, 1);
    });

    test('RFID / employee errors → operator rejected (Doc 13 §9)', () {
      for (final code in [
        BackendErrorCodes.rfidNotFound,
        BackendErrorCodes.rfidInactive,
        BackendErrorCodes.employeeNotFound,
        BackendErrorCodes.employeeInactive,
      ]) {
        expect(
          routeExchangeError(ExchangeCommand.lookupOperator, _e(code)),
          isA<OperatorRejected>(),
        );
      }
      expect(
        routeExchangeError(
          ExchangeCommand.lookupOperator,
          _e(BackendErrorCodes.factoryScopeDenied),
        ),
        isA<OperatorRejected>(),
      );
      expect(
        routeExchangeError(
          ExchangeCommand.identifyOperator,
          _e(BackendErrorCodes.validationError),
        ),
        isA<OperatorRejected>(),
        reason: '/operator answers 400 for an unusable card',
      );
    });

    test('400 on /type or /new-needle → stale master data (Doc 17 §13)', () {
      for (final command in [
        ExchangeCommand.selectType,
        ExchangeCommand.selectNewNeedle,
      ]) {
        expect(
          routeExchangeError(command, _e(BackendErrorCodes.validationError)),
          isA<MasterDataStale>(),
        );
      }
    });

    test('generic 409 depends on the command', () {
      final conflict = _e(
        BackendErrorCodes.conflict,
        category: ErrorCategory.conflict,
      );
      expect(
        routeExchangeError(ExchangeCommand.recordFragment, conflict),
        isA<NoApproverAvailable>(),
      );
      expect(
        routeExchangeError(ExchangeCommand.storeUsedNeedle, conflict),
        isA<NoStorageMapping>(),
      );
      expect(
        routeExchangeError(ExchangeCommand.uploadEvidence, conflict),
        isA<ResyncWithServer>(),
      );
    });

    test('device / session problems are left to the app-wide handlers', () {
      for (final code in [
        BackendErrorCodes.deviceInactive,
        BackendErrorCodes.deviceNotFound,
        BackendErrorCodes.unauthorized,
      ]) {
        expect(
          routeExchangeError(ExchangeCommand.issue, _e(code)),
          isA<HandledGlobally>(),
        );
      }
    });

    test('EXCHANGE_NOT_FOUND → gone; anything else → message only', () {
      expect(
        routeExchangeError(
          ExchangeCommand.refresh,
          _e(BackendErrorCodes.exchangeNotFound),
        ),
        isA<ExchangeGone>(),
      );
      expect(
        routeExchangeError(ExchangeCommand.issue, _e('SOMETHING_NEW')),
        isA<ShowError>(),
      );
    });
  });
}
