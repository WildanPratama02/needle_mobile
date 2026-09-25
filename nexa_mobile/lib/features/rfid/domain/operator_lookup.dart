import 'package:nexa_mobile/core/error/app_error.dart';

/// `GET /rfid/cards/uid/{rfidUid}` answer (Doc 13 §8).
final class RfidOperator {
  const RfidOperator({
    required this.rfidUid,
    required this.employeeId,
    required this.employeeNumber,
    required this.name,
    required this.factoryId,
  });

  /// The UID as read — sent unchanged to `POST /exchanges/{id}/operator`.
  final String rfidUid;
  final String employeeId;
  final String employeeNumber;
  final String name;
  final String factoryId;
}

sealed class OperatorLookupOutcome {
  const OperatorLookupOutcome();
}

final class OperatorFound extends OperatorLookupOutcome {
  const OperatorFound(this.operator);

  final RfidOperator operator;
}

final class OperatorLookupFailed extends OperatorLookupOutcome {
  const OperatorLookupFailed(this.error);

  /// `RFID_NOT_FOUND`, `RFID_INACTIVE`, `EMPLOYEE_INACTIVE`,
  /// `FACTORY_SCOPE_DENIED`, or a transport error.
  final AppError error;
}

/// Operator lookup is online only in v1 (contract matrix MG-6): bootstrap has
/// no employee roster, so an offline tablet cannot show who tapped.
abstract interface class RfidRepository {
  Future<OperatorLookupOutcome> lookup(String rfidUid);
}
