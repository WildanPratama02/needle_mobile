import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

/// Outcome of one exchange command or read. Business outcomes are values, not
/// exceptions.
sealed class CommandResult<T> {
  const CommandResult();
}

final class CommandOk<T> extends CommandResult<T> {
  const CommandOk(this.value);

  final T value;
}

final class CommandFailed<T> extends CommandResult<T> {
  const CommandFailed(this.error);

  final AppError error;
}

/// The exchange endpoints that stay on plain HTTP (Docs/12 §10).
///
/// Only starting an exchange and identifying its operator are sent this way:
/// both need a connection anyway (nexa_mobile/CLAUDE.md §2 "Offline scope",
/// MG-6). Every later step — type, fragment, new needle, issue, storage,
/// complete, cancel — is a queued `POST /mobile/sync` command
/// (`features/sync`), online or offline, so no step can ever be sent both
/// ways under two different idempotency keys.
///
/// Every mutating call takes the `Idempotency-Key` chosen by the caller
/// (`IdempotencyAttempts`); the implementation retries only the Doc 07 §41
/// whitelist, resending the same key.
abstract interface class ExchangeRepository {
  /// `POST /exchanges` — factory/trolley/device come from the device context
  /// (Doc 07 §4), never from the PIC.
  Future<CommandResult<ExchangeSnapshot>> create({
    required String clientTransactionId,
    required String factoryId,
    required String trolleyId,
    required String deviceId,
    required String idempotencyKey,
  });

  Future<CommandResult<ExchangeSnapshot>> fetch(String exchangeId);

  /// `POST /exchanges/{id}/operator { rfidUid }`.
  Future<CommandResult<ExchangeSnapshot>> identifyOperator(
    String exchangeId, {
    required String rfidUid,
    required String idempotencyKey,
  });

  /// `GET /confirmations/{id}` (`CONFIRMATION_VIEW`; the exchange routes carry
  /// only `confirmationId`, MG-10).
  Future<CommandResult<ConfirmationSnapshot>> fetchConfirmation(
    String confirmationId,
  );
}

/// A new confirmation status to store; `status == null` means "no
/// confirmation required" (MG-10). Passing no update keeps what is stored.
final class ConfirmationUpdate {
  const ConfirmationUpdate(this.status);

  final ConfirmationStatus? status;
}

/// This tablet's local record of one exchange (`local_exchange`).
///
/// [serverSnapshot] is the last answer the backend gave — kept so an
/// interrupted exchange can be resumed and projected offline. It is only
/// ever replaced by a newer server answer, never edited locally (ADR-004).
final class LocalExchangeRecord {
  const LocalExchangeRecord({
    required this.clientTransactionId,
    required this.createIdempotencyKey,
    required this.deviceId,
    this.serverExchangeId,
    this.exchangeNumber,
    this.lastKnownState,
    this.operator,
    this.serverSnapshot,
    this.confirmationStatus,
    this.createdAt,
    this.closedAt,
    this.syncConfirmedAt,
  });

  final String clientTransactionId;
  final String createIdempotencyKey;
  final String deviceId;
  final String? serverExchangeId;
  final String? exchangeNumber;
  final ExchangeState? lastKnownState;
  final OperatorIdentity? operator;
  final ExchangeSnapshot? serverSnapshot;

  /// From sync results / pulls / `GET /confirmations`; `null` when not
  /// required or not known yet.
  final ConfirmationStatus? confirmationStatus;
  final DateTime? createdAt;

  /// The PIC queued `COMPLETE_EXCHANGE` / `CANCEL_EXCHANGE`, or the server
  /// reported a terminal state: the wizard no longer resumes it by itself.
  final DateTime? closedAt;

  /// Terminal on the server with nothing left to send (start of the 7-day
  /// retention, nexa_mobile/CLAUDE.md §2 "Local retention").
  final DateTime? syncConfirmedAt;

  bool get isTerminal => lastKnownState?.isTerminal ?? false;
}

/// Local persistence of this tablet's exchanges: resuming after the app was
/// killed, offline projection, sync bookkeeping and retention.
abstract interface class ActiveExchangeStore {
  /// The exchange the wizard resumes on [deviceId]: not closed, not terminal,
  /// most recently started. Finished rows of another device (after
  /// re-provisioning) are dropped; unsynced ones are kept but never resumed.
  Future<LocalExchangeRecord?> current(String deviceId);

  Future<LocalExchangeRecord?> byId(String clientTransactionId);

  /// Every local exchange, newest first.
  Future<List<LocalExchangeRecord>> all();

  /// Written **before** `POST /exchanges` is sent.
  Future<void> begin(LocalExchangeRecord record);

  /// After any server answer (HTTP, sync result, pull). Ignored when the
  /// snapshot is older than the one held (state never moves backwards). A
  /// terminal state also closes the record.
  Future<void> recordServerState(
    String clientTransactionId,
    ExchangeSnapshot exchange, {
    ConfirmationUpdate? confirmation,
  });

  /// An evidence upload answered with the exchange's new state.
  Future<void> recordEvidenceState(
    String clientTransactionId,
    ExchangeState state,
  );

  Future<void> recordConfirmation(
    String clientTransactionId,
    ConfirmationStatus? status,
  );

  Future<void> recordOperator(
    String clientTransactionId,
    OperatorIdentity operator,
  );

  /// The PIC queued the final step (complete / cancel).
  Future<void> markClosed(String clientTransactionId);

  /// A rejection brought the exchange back to the PIC.
  Future<void> reopen(String clientTransactionId);

  /// The server does not know the exchange (`EXCHANGE_NOT_FOUND`): delete it.
  Future<void> forget(String clientTransactionId);

  /// Starts the retention clock of terminal exchanges with nothing left.
  Future<void> markSyncConfirmed(Iterable<String> ids, DateTime at);

  /// Deletes exchanges whose sync was confirmed before [before]; returns
  /// their keys so queue rows and photos can go too.
  Future<List<String>> purgeConfirmedBefore(DateTime before);
}
