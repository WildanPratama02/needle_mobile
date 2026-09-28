/// The queued exchange steps (Docs/12 §19, Doc 15 §9) as the tablet keeps
/// them in `local_sync_queue`.
library;

/// `commandType` of `POST /mobile/sync` — the backend's `SYNC_COMMAND_TYPES`,
/// in the Doc 15 §12 dependency order.
enum SyncCommandType {
  createExchange('CREATE_EXCHANGE'),
  assignOperator('ASSIGN_OPERATOR'),
  selectExchangeType('SELECT_EXCHANGE_TYPE'),
  fragmentValidation('FRAGMENT_VALIDATION'),
  selectNewNeedle('SELECT_NEW_NEEDLE'),
  issueNeedle('ISSUE_NEEDLE'),
  storeUsedNeedle('STORE_USED_NEEDLE'),
  completeExchange('COMPLETE_EXCHANGE'),
  cancelExchange('CANCEL_EXCHANGE');

  const SyncCommandType(this.wire);

  final String wire;

  static SyncCommandType? fromWire(String? value) {
    for (final t in values) {
      if (t.wire == value) return t;
    }
    return null;
  }

  /// Whether the wizard may put this step in the queue. Starting an exchange
  /// and identifying the operator need a connection (nexa_mobile/CLAUDE.md
  /// §2 "Offline scope", MG-6); the backend still accepts both types, so they
  /// stay part of the model.
  bool get queueable => this != createExchange && this != assignOperator;

  /// The backend refuses this step until the mandatory evidence is uploaded
  /// (MG-7): `SELECT_NEW_NEEDLE` and everything after it. Photos are not sync
  /// commands, so the engine uploads them before sending one of these.
  bool get needsEvidence => switch (this) {
    selectNewNeedle ||
    issueNeedle ||
    storeUsedNeedle ||
    completeExchange => true,
    _ => false,
  };

  /// `COMPLETE_EXCHANGE` / `CANCEL_EXCHANGE`: the PIC is done with the
  /// exchange on the tablet (it may still be waiting for the server).
  bool get closesExchange => this == completeExchange || this == cancelExchange;
}

/// Where a queued command stands on the tablet. A command that was never
/// executed and is no longer wanted is deleted, not given a status.
enum SyncCommandStatus {
  /// Waiting to be sent (first time, after `FAILED`, or behind a command that
  /// did not succeed — `SKIPPED`).
  queued('QUEUED'),

  /// `SUCCESS` / `IDEMPOTENT_SUCCESS`: executed on the server.
  accepted('ACCEPTED'),

  /// `REJECTED`: a business rule said no. Never re-sent automatically
  /// (Doc 15 §14); the PIC resolves it.
  rejected('REJECTED');

  const SyncCommandStatus(this.wire);

  final String wire;

  static SyncCommandStatus fromWire(String value) => switch (value) {
    'ACCEPTED' => accepted,
    'REJECTED' => rejected,
    _ => queued,
  };
}

/// `error` of a sync result (`{ code, message, context }`), kept with the
/// command so the PIC and the wizard can see why it did not go through.
final class SyncCommandError {
  const SyncCommandError({
    required this.code,
    this.message = '',
    this.context = const {},
  });

  final String code;

  /// The backend's English message — logs only, never shown (Doc 17 §32).
  final String message;
  final Map<String, Object?> context;
}

/// One queued exchange step.
final class SyncCommand {
  const SyncCommand({
    required this.sequence,
    required this.commandId,
    required this.clientTransactionId,
    required this.type,
    required this.payload,
    required this.occurredAt,
    required this.status,
    required this.createdAt,
    this.attemptCount = 0,
    this.nextAttemptAt,
    this.lastResult,
    this.lastError,
  });

  /// Creation order; the send order, across and within exchanges.
  final int sequence;

  /// The command's idempotency key. Generated once when queued and never
  /// regenerated, so a resend after a lost answer replays instead of
  /// executing twice (Doc 15 §10).
  final String commandId;

  /// The exchange's key, the one its `POST /exchanges` carried.
  final String clientTransactionId;
  final SyncCommandType type;

  /// Exactly the backend payload (it rejects unknown keys).
  final Map<String, Object?> payload;

  /// Device time the PIC took the step (audit metadata only).
  final DateTime occurredAt;
  final SyncCommandStatus status;
  final DateTime createdAt;

  /// Technical failures so far (whole request or `FAILED`).
  final int attemptCount;

  /// Earliest automatic resend after a technical failure (Doc 15 §14).
  final DateTime? nextAttemptAt;

  /// Wire status of the last answer (`FAILED`, `SKIPPED`, …) or `NETWORK`
  /// when the whole request got none.
  final String? lastResult;
  final SyncCommandError? lastError;

  bool get isQueued => status == SyncCommandStatus.queued;
  bool get isRejected => status == SyncCommandStatus.rejected;

  /// A technical failure is standing: the engine keeps retrying on its own.
  bool get hasTechnicalFailure => isQueued && attemptCount > 0;
}
