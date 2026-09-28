/// The server's view of an exchange (`ExchangeResponseDto`, Docs/12). The
/// tablet never edits these values itself — every change comes back from a
/// backend answer (ADR-004).
library;

/// Exchange State — canonical values from CONTEXT.md / the DB enum. Named
/// `status` on the wire. Never mixed with local sync state (Doc 15 §8).
enum ExchangeState {
  created('CREATED'),
  operatorIdentified('OPERATOR_IDENTIFIED'),

  /// Transient: `/type` writes it and `EXCHANGE_TYPE_SELECTED` in one
  /// transaction, so a read never observes it in practice.
  needleSelected('NEEDLE_SELECTED'),
  exchangeTypeSelected('EXCHANGE_TYPE_SELECTED'),
  fragmentCheck('FRAGMENT_CHECK'),
  confirmationPending('CONFIRMATION_PENDING'),
  evidenceCaptured('EVIDENCE_CAPTURED'),
  newNeedleSelected('NEW_NEEDLE_SELECTED'),
  needleIssued('NEEDLE_ISSUED'),
  usedNeedleStored('USED_NEEDLE_STORED'),
  completed('COMPLETED'),
  cancelled('CANCELLED');

  const ExchangeState(this.wire);

  final String wire;

  static ExchangeState? fromWire(String? value) {
    for (final s in values) {
      if (s.wire == value) return s;
    }
    return null;
  }

  bool get isTerminal => this == completed || this == cancelled;

  /// How far along the (forward-only) state machine this state is. A server
  /// answer never moves an exchange backwards, so a snapshot of lower rank
  /// than the one already held is stale (e.g. an `IDEMPOTENT_SUCCESS`
  /// replaying the original result of an older step).
  int get progressRank => isTerminal ? values.length : index;

  /// Stock was already decremented: cancelling now makes the backend write a
  /// `REVERSAL` movement (Docs/02 §22–23, `POST_ISSUE_STATES`).
  bool get stockIssued => this == needleIssued || this == usedNeedleStored;
}

/// Fragment Status — data field of a BROKEN exchange (CONTEXT.md).
enum FragmentStatus {
  found('FOUND'),
  notFound('NOT_FOUND');

  const FragmentStatus(this.wire);

  final String wire;

  static FragmentStatus? fromWire(String? value) => switch (value) {
    'FOUND' => found,
    'NOT_FOUND' => notFound,
    _ => null,
  };
}

/// Confirmation status (CONTEXT.md). "Not required" is `null` on the wire
/// (contract matrix MG-10), so it is `null` here too, never a fifth value.
enum ConfirmationStatus {
  pending('PENDING'),
  approved('APPROVED'),
  rejected('REJECTED'),
  expired('EXPIRED');

  const ConfirmationStatus(this.wire);

  final String wire;

  static ConfirmationStatus? fromWire(String? value) {
    for (final s in values) {
      if (s.wire == value) return s;
    }
    return null;
  }

  bool get blocksExchange => this == rejected || this == expired;
}

/// The Exchange Type code that carries the fragment rule (backend
/// `BROKEN_EXCHANGE_TYPE`).
const brokenExchangeTypeCode = 'BROKEN';

final class ExchangeSnapshot {
  const ExchangeSnapshot({
    required this.id,
    required this.exchangeNumber,
    required this.state,
    required this.factoryId,
    required this.trolleyId,
    required this.deviceId,
    this.operatorId,
    this.operatorEmployeeNumber,
    this.operatorName,
    this.exchangeTypeId,
    this.exchangeTypeCode,
    this.exchangeTypeName,
    this.oldNeedleTypeId,
    this.newNeedleTypeId,
    this.fragmentStatus,
    this.confirmationId,
    this.createdAt,
    this.completedAt,
    this.cancelledAt,
  });

  final String id;
  final String exchangeNumber;
  final ExchangeState state;
  final String factoryId;
  final String trolleyId;
  final String deviceId;
  final String? operatorId;

  /// The operator's labels (contract matrix MG-4). Optional on the wire: a
  /// backend older than MG-4 does not send them, and they are `null` until
  /// the operator step.
  final String? operatorEmployeeNumber;
  final String? operatorName;
  final String? exchangeTypeId;
  final String? exchangeTypeCode;
  final String? exchangeTypeName;
  final String? oldNeedleTypeId;
  final String? newNeedleTypeId;
  final FragmentStatus? fragmentStatus;
  final String? confirmationId;

  /// Server time the exchange was opened (`createdAt`, always sent by the
  /// backend; `null` only for a snapshot stored before it was kept).
  final DateTime? createdAt;
  final DateTime? completedAt;
  final DateTime? cancelledAt;

  bool get isBroken => exchangeTypeCode == brokenExchangeTypeCode;

  /// For the local projection of queued steps only — never to invent a
  /// server answer (ADR-004).
  ExchangeSnapshot copyWith({
    ExchangeState? state,
    String? exchangeTypeId,
    String? exchangeTypeCode,
    String? exchangeTypeName,
    String? oldNeedleTypeId,
    String? newNeedleTypeId,
    FragmentStatus? fragmentStatus,
  }) => ExchangeSnapshot(
    id: id,
    exchangeNumber: exchangeNumber,
    state: state ?? this.state,
    factoryId: factoryId,
    trolleyId: trolleyId,
    deviceId: deviceId,
    operatorId: operatorId,
    operatorEmployeeNumber: operatorEmployeeNumber,
    operatorName: operatorName,
    exchangeTypeId: exchangeTypeId ?? this.exchangeTypeId,
    exchangeTypeCode: exchangeTypeCode ?? this.exchangeTypeCode,
    exchangeTypeName: exchangeTypeName ?? this.exchangeTypeName,
    oldNeedleTypeId: oldNeedleTypeId ?? this.oldNeedleTypeId,
    newNeedleTypeId: newNeedleTypeId ?? this.newNeedleTypeId,
    fragmentStatus: fragmentStatus ?? this.fragmentStatus,
    confirmationId: confirmationId,
    createdAt: createdAt,
    completedAt: completedAt,
    cancelledAt: cancelledAt,
  );
}

/// `GET /confirmations/{id}` — only what the waiting screen needs.
final class ConfirmationSnapshot {
  const ConfirmationSnapshot({
    required this.id,
    required this.status,
    required this.exchangeState,
    this.confirmationNumber,
    this.rejectionReason,
    this.dueAt,
  });

  final String id;
  final ConfirmationStatus status;

  /// Where the exchange sits — a decided confirmation does not move it.
  final ExchangeState? exchangeState;
  final String? confirmationNumber;

  /// Reason of the REJECT decision (mandatory on rejection, CONTEXT.md
  /// "Approval").
  final String? rejectionReason;
  final DateTime? dueAt;
}

/// The operator resolved from an RFID tap, kept for the summary screens.
final class OperatorIdentity {
  const OperatorIdentity({
    required this.employeeNumber,
    required this.name,
    this.employeeId,
  });

  final String? employeeId;
  final String employeeNumber;
  final String name;
}
